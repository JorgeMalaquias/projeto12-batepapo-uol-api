import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs';
import { MongoClient, ObjectId } from 'mongodb';
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db("database_uol");
});

const server = express();
server.use([cors(), express.json()]);

const participantsSchema = joi.object({
    name: joi.string().required()
})

function messagesFilter(currentUser, msgType, msgSender, msgReceiver){
    if((msgType==="private_message") && (currentUser!==msgReceiver) && (currentUser!==msgSender)){
        return false;
    }else{
        return true;
    }
}

server.post('/participants', async (req, res) => {
    const validation = participantsSchema.validate(req.body);
    if (validation.error) {
        console.log(validation.error.details);
        return res.sendStatus(422);
    }
    try {
        const alreadyExist = await db.collection('participants').findOne({ name: req.body.name });
        if (!alreadyExist) {
            await db.collection('participants').insertOne({
                name: req.body.name,
                lastStatus: Date.now()
            });
            await db.collection('messages').insertOne({
                from: req.body.name, 
                to: 'Todos', 
                text: 'entra na sala...', 
                type: 'status', 
                time: `${dayjs().$H}:${dayjs().$m}:${dayjs().$s}`
            });
            return res.sendStatus(201);
        } else {
            return res.sendStatus(409);
        }

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
})
server.get('/participants', async (req, res) => {
    try {
        const participants = await db.collection('participants').find().toArray();
        res.send(participants);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }

})
server.get('/messages', async (req,res)=>{
    const limit = parseInt(req.query.limit);
    const name = req.header.user;
    try{
        const messages = await db.collection('messages').find().toArray();
        const messagesAllowed = messages.filter((m)=>messagesFilter(name,m.type,m.from,m.to));
        if(limit){
            res.send(messagesAllowed.slice(messagesAllowed.length-limit,messagesAllowed.length));
        }else{
            res.send(messagesAllowed);
        }
    }catch(err) {
        console.error(err);
        res.sendStatus(500);
    }
})
server.listen(5000);
