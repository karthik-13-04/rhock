import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const runTest = async () => {
  const config = {
    region: 'SIN',
    endpoint: 'https://sin1.contabostorage.com',
    credentials: {
      accessKeyId: 'e22830487ad1d0c1d56b1a8df59e8227',
      secretAccessKey: 'd37bc638d20de63f45ffbd95c35b24c4',
    },
    forcePathStyle: true,
  };

  console.log('Testing S3 Config:', { ...config, credentials: '***' });

  const client = new S3Client(config);
  const bucket = 'd9a91b8a36b34cc59e571d07f57dd57b:hotelrockdale';
  const key = `test-sdk-${Date.now()}.txt`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: 'Hello from SDK v3 test',
      ContentType: 'text/plain',
    });

    console.log('Sending PutObjectCommand...');
    const response = await client.send(command);
    console.log('Success!', response);
    console.log('URL:', `https://sin1.contabostorage.com/${bucket}/${key}`);
  } catch (err) {
    console.error('FAILED with error:');
    console.error(err);
    if (err.$metadata) {
       console.error('Metadata:', err.$metadata);
    }
  }
};

runTest();
