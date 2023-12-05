sudo apt update  -y

sudo apt upgrade -y

sudo apt install redis-server -y


wget https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-x64.tar.xz

tar -xf node-v20.10.0-linux-x64.tar.xz

mkdir -p  ~/.local

mv node-v20.10.0-linux-x64  ~/.local/

echo 'export PATH=/usr/local/lib/nodejs/node-v20.10.0-linux-x64/bin:$PATH' >> ~/.bashrc

export PATH=/usr/local/lib/nodejs/node-v20.10.0-linux-x64/bin:$PATH

source ~/.bashrc


npm i -g pm2
npm i -g typescript
npm i -g nodemon

git clone https://github.com/spidey52/binance-spot-trade-backend

cd binance-spot-trade-backend

npm i
npm i esbuild-runner
npm run build

touch .env

echo "
MONGO_URI=
API_KEY=
API_SECRET=

NODE_ENV=production

FUTURE_API_KEY=
FUTURE_API_SECRET=

FIREBASE_SERVICE_ACCOUNT=/home/ubuntu/algo_trade_flutter.json

SERVER_NAME= 
" >> .env


