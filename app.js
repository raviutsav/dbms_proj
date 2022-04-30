const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const { render } = require('ejs')

const app = express()
const port = process.env.PORT || 5000

const publicDirPath = path.join(__dirname,'./public')

app.set('view engine', 'ejs')
app.use(express.static(publicDirPath))

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

// MySQL code
const pool = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'root',
    password        : '',
    database        : 'dms'
});

// Get all staff details from database

app.get('/staff_page', (req, res) => {

    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log(`connected as id: ${connection.threadId}`)

        // query(sqlstring, callback fun)
        connection.query('SELECT * from staff', (err, rows) => {
            connection.release() // return the conneciton to pool

            if(!err) {
                // console.log(rows[0].staff_id)
                res.render('staff_page', {rows: rows, title: "staff"})
            } else {
                console.log(err)
            }
        })
    })
})

app.post('/staff_page',function(req, res) {

    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log(`connected as id ${connection.threadId}`)
        
        const params = req.body;
        connection.query('INSERT INTO staff SET ?', params, (err, rows) => {

            if(!err) {
                res.render('index',{ message: "staff added", title: "staff"})
            } else {
                console.log(err)
            }
        })
    })
})

app.get('/', function(req, res){
    // res.sendFile(__dirname + '/views/index.ejs')
    res.render('index', {message: "", title: "home"})
});

app.post('/purchase_page', function(req, res) {

    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log(`connected as id ${connection.threadId}`)
        
        const params = req.body;
        params.total = (params.quantity * params.rate)

        const params_t = {}
        params_t.staff_id = params.staff_id
        params_t.date = params.date
        params_t.milk_type = params.milk_type
        params_t.quantity = params.quantity
        params_t.rate = params.rate
        params_t.total = params.total
        params_t.type = "debit"

        // var check_query = "COUNT(*) as count FROM staff WHERE staff_id = " + params.staff_id
        // connection.query(check_query, (err, rows) => {
        //     if(rows[0].count < 1) {
        //         connection.release()
        //         return render('index', {
        //             message : str("Invalid Staff ID")
        //         })
        //     }
        // })
        
        connection.query('INSERT INTO transaction SET ?', params_t, (err, rows) => {

            if(!err) {
                console.log(rows)
            } else {
                console.log(err)
            }
        })

        const params_s = {};
        params_s.milk_type = params.milk_type
        params_s.quantity = params.quantity

        var sql = "SELECT COUNT(*) as count FROM stock WHERE milk_type = '" + params.milk_type + "'"
        connection.query(sql, params_s, (err, rows) => {

            if(rows[0].count == 0) {
                connection.query('INSERT INTO stock SET ?', params_s, (err, rows) => {

                    if(!err) {
                        console.log(rows)
                    } else {
                        console.log(err)
                    }
                })
            } else {
                var update_query = "UPDATE stock SET quantity = quantity + " + params_s.quantity + " WHERE milk_type = '" + params.milk_type + "'"

                connection.query(update_query, params_s, (err, rows) => {

                    if(!err) {
                        console.log(rows)
                    } else {
                        console.log(err)
                    }
                })
            }
            
        })
        connection.query('INSERT INTO purchase SET ?', params, (err, rows) => {
            connection.release()

            if(!err) {
                res.render('index', {message: "successfully Purchased", title: "purchase"})
            } else {
                console.log(err)
            }
        })

        console.log(req.body)
    })
    
});



app.get('/purchase_page', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log(`connected as id: ${connection.threadId}`)

        // query(sqlstring, callback fun)
        connection.query('SELECT * from purchase', (err, rows) => {
            connection.release() // return the conneciton to pool

            if(!err) {
                // console.log(rows[0].staff_id)
                res.render('purchase_page', {rows: rows, title: "purchase"})
            } else {
                console.log(err)
            }
        })
    })
})


app.get('/sales_page', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log(`connected as id: ${connection.threadId}`)

        // query(sqlstring, callback fun)
        connection.query('SELECT * from sales', (err, rows) => {
            connection.release() // return the conneciton to pool

            if(!err) {
                // console.log(rows[0].staff_id)
                res.render('sales_page', {rows: rows, title: "sales"})
            } else {
                console.log(err)
            }
        })
    })
})


app.post('/sales_page', function(req, res) {

    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log(`connected as id ${connection.threadId}`)
        
        const params = req.body;
        params.total = (params.quantity * params.rate)

        const params_t = {}
        params_t.staff_id = params.staff_id
        params_t.date = params.date
        params_t.milk_type = params.milk_type
        params_t.quantity = params.quantity
        params_t.rate = params.rate
        params_t.total = params.total
        params_t.type = "credit"

        var check_query = "SELECT quantity FROM stock WHERE milk_type = '" + params.milk_type + "'"
        connection.query(check_query, (err, rows) => {
            if(rows[0].quantity < params.quantity) {
                connection.release()
                return render('index', {
                    message : str("There is only " + rows[0].quantity + "L " + params.milk_type +" milk present in stock"),
                    title: "sales"
                })
            }
        })
        
        connection.query('INSERT INTO transaction SET ?', params_t, (err, rows) => {

            if(!err) {
                console.log(rows)
            } else {
                console.log(err)
            }
        })

        const params_s = {};
        params_s.milk_type = params.milk_type
        params_s.quantity = params.quantity

        var sql = "SELECT COUNT(*) as count FROM stock WHERE milk_type = '" + params.milk_type + "'"
        connection.query(sql, params_s, (err, rows) => {

            if(rows[0].count == 0) {
                connection.query('INSERT INTO stock SET ?', params_s, (err, rows) => {

                    if(!err) {
                        console.log(rows)
                    } else {
                        console.log(err)
                    }
                })
            } else {
                var update_query = "UPDATE stock SET quantity = quantity - " + params_s.quantity + " WHERE milk_type = '" + params.milk_type + "'"

                connection.query(update_query, params_s, (err, rows) => {

                    if(!err) {
                        console.log(rows)
                    } else {
                        console.log(err)
                    }
                })
            }
            
        })

        connection.query('INSERT INTO sales SET ?', params, (err, rows) => {
            connection.release()

            if(!err) {
                res.render('index', {message: "Successfully Selled", title : "sales"})
            } else {
                console.log(err)
            }
        })

        console.log(req.body)
    })
    
});




// Listen on environment port or 5000
app.listen(port, () => {
    console.log(`listen on port ${port}`)
})


app.get('/transaction_page', function(req, res) {
    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log(`connected as id: ${connection.threadId}`)

        // query(sqlstring, callback fun)
        connection.query('SELECT * from transaction', (err, rows) => {
            connection.release() // return the conneciton to pool

            if(!err) {
                // console.log(rows[0].staff_id)
                res.render('transaction_page', {rows: rows, title: "transaction"})
            } else {
                console.log(err)
            }
        })
    })
})

app.get('/stock_page', function(req, res) {
    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log(`connected as id: ${connection.threadId}`)

        // query(sqlstring, callback fun)
        connection.query('SELECT * from stock', (err, rows) => {
            connection.release() // return the conneciton to pool

            if(!err) {
                // console.log(rows[0].staff_id)
                res.render('stock_page', {rows: rows, title: "stock"})
            } else {
                console.log(err)
            }
        })
    })
})