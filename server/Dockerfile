# Use the official lightweight Node.js 18 image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (matches the PORT in .env)
EXPOSE 5000

# Command to run the application in development mode
# (Assuming you have a "dev": "nodemon src/server.js" script in package.json)
CMD ["npm", "run", "dev"]