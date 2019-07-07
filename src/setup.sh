#!/bin/bash

# Initialize a mongo data folder and logfile
mkdir -p /data/db
touch /var/log/mongodb.log
chmod 777 /var/log/mongodb.log
echo "STEP 1/6 Starting MongoDB"
# Start mongodb with logging
# --logpath    Without this mongod will output all log information to the standard output.
# --logappend  Ensure mongod appends new entries to the end of the logfile. We create it first so that the below tail always finds something
docker-entrypoint.sh mongod --logpath /var/log/mongodb.log --logappend &

# Wait until mongo logs that it's ready (or timeout after 60s)
COUNTER=0
grep -q 'waiting for connections on port' /var/log/mongodb.log
while [[ $? -ne 0 && $COUNTER -lt 60 ]] ; do
    sleep 2
    let COUNTER+=2
    echo "Waiting for mongo to initialize... ($COUNTER seconds so far)"
    grep -q 'waiting for connections on port' /var/log/mongodb.log
done

# Unzip source
echo "STEP 2/6 Unzip the downloaded Dataset"
unzip /src/dataset.zip -d /src/unzipDestDataset

# Restore from dump
echo "STEP 3/6 Mongo restore initiated"
mongorestore --drop /src/unzipDestDataset

# Delete  source files bash file
echo "STEP 4/6 Removing temporary files"
rm -rf /src/unzipDestDataset
rm /src/setup.sh

echo "STEP 5/6 Building React Web application"
cd graphiql
# Install Node Modules
npm install
# Starting application
npm run build
rm -r node_modules
echo "STEP 6/6 Starting API Server"
cd ../server
# Install Node Modules
npm install
# Starting application
npm start

# Keep container running
tail -f /dev/null
