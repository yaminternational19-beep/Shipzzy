import { PutObjectCommand,
  DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';

import s3 from '../config/s3.js';

const bucket = process.env.AWS_BUCKET;


export const getFileUrl = (key) => {
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// const uploadFile = async (file, folder) => {

//   const key = generateKey(folder, file.originalname);

//   const params = {
//     Bucket: bucket,
//     Key: key,
//     Body: file.buffer,
//     ContentType: file.mimetype,
//   };

//   await s3.send(new PutObjectCommand(params));

//   return {
//     key,
//     url: getFileUrl(key)
//   };
// };


export const uploadFile = async (file, folder) => {

  const bucket = process.env.AWS_BUCKET;

  const ext = path.extname(file.originalname);

  const fileName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;

  const key = `${folder}/${fileName}`;

  const params = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  await s3.send(new PutObjectCommand(params));

  const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    url,
    key
  };
};


export const deleteFile = async (key) => {

  const bucket = process.env.AWS_BUCKET;

  if (!bucket) {
    throw new Error("AWS_BUCKET is not defined");
  }

  const params = {
    Bucket: bucket,
    Key: key
  };

  await s3.send(new DeleteObjectCommand(params));
};


export const updateFile = async (oldKey, file, folder) => {

  if (oldKey) {
    await deleteFile(oldKey);
  }

  return await uploadFile(file, folder);
};

export default {
  uploadFile,
  deleteFile,
  updateFile,
  getFileUrl
};