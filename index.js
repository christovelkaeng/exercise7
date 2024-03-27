const express = require('express')
const app = express()
const morgan = require('morgan')
const path = require('path')    
const multer = require('multer')
const fs = require('fs')
const upload = multer({ dest: 'document/'})
const cors = require('cors')
const getUsers = require('./users')
const db = require('./db.js')

const hostname = '127.0.0.1'
const port = 3000

app.use(cors(
    {
        origin: 'http://127.0.0.1:5500',
        credentials: true
    }
))

app.get('/data', (req, res) => {
    res.json({
        name: "John Doe",
        age: 25
    })
})

app.use(morgan('combined'))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.post('/login', (req, res) => {
    const {username, password} = req.body
    res.json(
        {
            status: "success",
            data: {
                username: username,
                password: password
            }
        }
    )
})

app.get('/students', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM users');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'document', 'index.html'))
})

app.get('/users', (req, res) => {
    res.json(getUsers)
})

app.get('/users/:name', (req, res) => {
    const user = getUsers.find(user => user.name.toLowerCase() === req.params.name.toLowerCase())
    if(user){
        res.json(user)
    }else {
        res.status(404).json({
            message: "Data user tidak ditemukan"
        })
    }
})

app.post('/users', (req, res) => {
    const { id, name } = req.body
    if(!id || !name) {
        res.status(400).json({
            error: "Masukan data yang akan diubah"
        })
    }else{
        getUsers.push(req.body)
        res.send(`User dengan id ${id} dan nama ${name} berhasil ditambahkan`)
    }
})

const imgExtensions = ['.jpg', '.jpeg', '.png', '.gif'] 

app.post('/upload', upload.single('photo'), (req, res) => {
    const photo = req.file 
    if (photo) {
        const fileExtension = path.extname(photo.originalname).toLowerCase() 
        if (imgExtensions.includes(fileExtension)) {
            const target = path.join(__dirname, 'public', photo.originalname) 
            fs.renameSync(photo.path, target) 
            res.send("File berhasil diupload") 
        } else {
            fs.unlinkSync(photo.path) 
            res.send("File yang diupload harus berupa gambar") 
        }
    } else {
        res.send("File gagal diupload") 
    }
})

app.post('/fileupload', upload.single('file'), (req, res) => {
    const file = req.file
    if(file){
        const target = path.join(__dirname, 'public', file.originalname)
        fs.renameSync(file.path, target)
        res.send("file berhasil diupload")
    }else{
        res.send("file gagal diupload")
    }
})

app.put('/users/:nameReq', (req, res) => {
    const { id, name } = req.body
    const { nameReq } = req.params

    const user = getUsers.find(user => user.name.toLowerCase() === nameReq.toLowerCase())

    if(user) {
        user.id = id
        user.name = name
        res.json({
            message: `User dengan nama ${nameReq} berhasil diperbarui menjadi ${name} dengan id ${id}`
        })
    }else{
        res.status(404).json({
            message: "Data user tidak ditemukan"
        })
    }
})

app.delete('/users/:name', (req, res) => {
    const { name } = req.params

    const user = getUsers.find(user => user.name.toLowerCase() === name.toLowerCase())
    if(user){
        getUsers.splice(getUsers.indexOf(user), 1)
        res.json({
            message: `User dengan nama ${name} berhasil dihapus`
        })
    }else{
        res.status(404).json({
            message: "Data user tidak ditemukan"
        })
    }
})

app.get('/students', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM public.students');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
});

app.post("/students", async (req, res) => {
    const { name, address } = req.body
    try {
        if(!name || !address){
            res.status(400).json({
                status: "error",
                message: "name dan address harus diisi"
            })
        }else if(name.length > 2 || address.length > 2){
            const result = await db.query(
                `INSERT into students (name, address) values ('${name}', '${address}')`
            )
            res.status(200).json({
                status: "success",
                message: "data berhasil dimasukan"
            })
        }
    }catch(err){
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
})

app.put("/students/:id", async (req, res) => {
    const { name, address } = req.body
    try{
        if(!name || !address){
            res.status(400).json({
                status: "error",
                message: "name dan address harus diisi"
            })
        }else if(name.length > 2 || address.length > 2){
            const result = await db.query(
                `UPDATE students SET name = '${name}', address = '${address}' WHERE id = ${req.params.id}`
            )
            res.status(200).json({
                status: "success",
                message: `data dengan id ${req.params.id} berhasil diubah`
            })
        }
    }catch(err){
        console.log(err)
        res.status(500).send("Internal Server Error")
    }
})

app.delete("/students/:id", async (req, res) => {
    try{
        const result = await db.query(
            `DELETE FROM students WHERE id = ${req.params.id}`
        )
        res.status(200).json({
            status: "success",
            message: `data dengan id ${req.params.id} berhasil dihapus`
        })
    }catch(err){
        console.log(err)
        res.status(500).send("Internal Server Error")
    }
})

app.get("/students/:id", async (req, res) => {
    try{
        const result = await db.query(
            `SELECT * FROM students WHERE id = ${req.params.id}`
        )
        if(result.rows.length > 0){
            res.status(200).json({
                data: result.rows
            })
        }else if(result.rows.length == 0){
            res.status(404).json({
                message: `data dengan id ${req.params.id} tidak ditemukan`
            })
        }
    }catch(err){
        console.log(err)
        res.status(500).send("Internal Server Error")
    }
})

app.use((req, res, next) => {
    res.status(404).json({
        status: "Error",
        message: "Resource tidak ditemukan",
    })
    next()
})

const errorHandling = (err, req, res, next) => {
    res.status(500).json({
        status : "error",
        message : "terjadi kesalahan pada server"
    })
}
app.use(errorHandling)

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`)
})