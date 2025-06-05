import { connect } from "mongoose";

async function connectDb() {
  try {
    const con = await connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('db connected successfully', con.connection.host)
  } catch (err) {
    console.error(`db connection failed: ${err.message}`);
  }
}

export default connectDb;
