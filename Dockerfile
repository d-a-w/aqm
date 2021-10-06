FROM derit/10.16.3-alpine-firebase AS builder
WORKDIR /app
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build


FROM derit/10.16.3-alpine-firebase
WORKDIR /app
COPY --from=builder /app ./
CMD ["npm", "run", "start:prod"]
