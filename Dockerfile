FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# In headless cloud environments, disable desktop/sound
ENV SOUND_ALERT=false
ENV DESKTOP_NOTIFICATION=false
ENV AUTO_OPEN_BROWSER=false

CMD ["node", "bot.js"]

