import amqp from 'amqplib'
import config from '../config/config.js';
import { json } from 'express';


let channel ,connection;

export async function connectRabbit(){

    connection = await amqp.connect(config.RABBITMQ_URI);
    channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");
}

export async function publishQueue(queueName , data){
    await channel.assertQueue(queueName ,{durable: true});
    await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
    console.log("Message sent to queue" , queueName)
}