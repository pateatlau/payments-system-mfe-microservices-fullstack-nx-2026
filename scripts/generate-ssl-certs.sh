#!/bin/bash
# Generate Self-Signed SSL Certificates for POC-3 Development
# 
# This script generates self-signed SSL/TLS certificates for local development.
# The certificates are valid for 365 days and include Subject Alternative Names (SAN)
# for localhost and 127.0.0.1.
#
# Usage: ./scripts/generate-ssl-certs.sh
#
# Output:
#   - nginx/ssl/self-signed.crt - SSL certificate
#   - nginx/ssl/self-signed.key - Private key
#   - nginx/ssl/dhparam.pem - Diffie-Hellman parameters (for forward secrecy)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SSL_DIR="nginx/ssl"
CERT_FILE="$SSL_DIR/self-signed.crt"
KEY_FILE="$SSL_DIR/self-signed.key"
DHPARAM_FILE="$SSL_DIR/dhparam.pem"
DAYS_VALID=365

echo -e "${GREEN}=== SSL Certificate Generation Script ===${NC}"
echo ""

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl is not installed${NC}"
    echo "Please install openssl and try again"
    exit 1
fi

# Check if SSL directory exists
if [ ! -d "$SSL_DIR" ]; then
    echo -e "${YELLOW}Creating SSL directory: $SSL_DIR${NC}"
    mkdir -p "$SSL_DIR"
fi

# Check if certificates already exist
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}Warning: Certificates already exist${NC}"
    read -p "Do you want to regenerate them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipping certificate generation${NC}"
        exit 0
    fi
    echo -e "${YELLOW}Removing existing certificates...${NC}"
    rm -f "$CERT_FILE" "$KEY_FILE" "$DHPARAM_FILE"
fi

# Generate private key
echo -e "${GREEN}Step 1/3: Generating private key (2048-bit RSA)...${NC}"
openssl genrsa -out "$KEY_FILE" 2048 2>/dev/null
echo -e "${GREEN}✓ Private key generated: $KEY_FILE${NC}"

# Generate self-signed certificate with SAN
echo -e "${GREEN}Step 2/3: Generating self-signed certificate (valid for $DAYS_VALID days)...${NC}"
openssl req -new -x509 \
    -key "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days $DAYS_VALID \
    -subj "/C=US/ST=State/L=City/O=MFE-POC-3/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1" \
    2>/dev/null
echo -e "${GREEN}✓ Certificate generated: $CERT_FILE${NC}"

# Generate Diffie-Hellman parameters
echo -e "${GREEN}Step 3/3: Generating Diffie-Hellman parameters (2048-bit)...${NC}"
echo -e "${YELLOW}(This may take a few minutes)${NC}"
openssl dhparam -out "$DHPARAM_FILE" 2048 2>/dev/null
echo -e "${GREEN}✓ DH parameters generated: $DHPARAM_FILE${NC}"

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"
chmod 644 "$DHPARAM_FILE"

echo ""
echo -e "${GREEN}=== Certificate Generation Complete ===${NC}"
echo ""
echo "Generated files:"
echo "  - Certificate: $CERT_FILE"
echo "  - Private Key: $KEY_FILE"
echo "  - DH Params:   $DHPARAM_FILE"
echo ""

# Display certificate information
echo -e "${GREEN}Certificate Information:${NC}"
openssl x509 -in "$CERT_FILE" -text -noout | grep -A2 "Subject:"
openssl x509 -in "$CERT_FILE" -text -noout | grep -A1 "Validity"
openssl x509 -in "$CERT_FILE" -text -noout | grep -A1 "Subject Alternative Name"
echo ""

# macOS Trust Certificate Instructions
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}=== macOS Trust Certificate (Optional) ===${NC}"
    echo "To trust this certificate in your browser on macOS, run:"
    echo ""
    echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_FILE"
    echo ""
    echo -e "${YELLOW}Note: You'll need to enter your password and restart your browser${NC}"
    echo ""
fi

echo -e "${GREEN}✓ SSL certificates ready for nginx configuration${NC}"
