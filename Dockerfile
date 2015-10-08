# Get the latest Node.
FROM node:4.1

# Set the environment to development.
ENV MC_ENV dev

# Install Multicolour globally.
RUN npm install multicolour -g

# Add our config and content.
COPY ../../config.js /var/www/config.js
COPY ../../content /var/www/content
WORKDIR /var/www

# Install Multicolour.
RUN npm i -g multicolour

# Install our dependencies.
RUN npm i .

# Run Multicolour.
CMD multicolour start -c /var/www/config.js
EXPOSE 1811
