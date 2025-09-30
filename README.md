# interview-helper
# interview-helper
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=YourCompany/OU=Dev/CN=e13-217-253-74.compute-1.amazonaws.com"
