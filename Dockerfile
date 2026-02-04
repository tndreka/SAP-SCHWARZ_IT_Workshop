FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (remove --production to include dev dependencies if needed)
RUN npm install

# Copy application files
COPY . .

# Make sure uploads directory exists
RUN mkdir -p uploads

# Expose port
EXPOSE 4004

# Start the application
CMD ["npm", "start"]