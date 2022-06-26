import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import {MongoClient, ObjectId} from 'mongodb';
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db("database_uol");
});

const server = express();
server.use([cors(), express.json()]);

server.listen(5000);
