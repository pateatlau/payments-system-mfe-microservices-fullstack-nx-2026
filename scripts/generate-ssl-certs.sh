#!/bin/bash
# Generate self-signed SSL certificates for POC-3 development
# Usage: ./scripts/generate-ssl-certs.sh

set -e

SSL_DIR="nginx/ssl"

echo "🔐 Generating SSL certificates for POC-3..."

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out "$SSL_DIR/self-signed.key" 2048

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl req -new -x509 \
    -key "$SSL_DIR/self-signed.key" \
    -out "$SSL_DIR/self-signed.crt" \
    -days 365 \
    -subj "/C=US/ST=State/L=City/O=MFE-POC/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# Verify certificate
echo "✅ Verifying certificate..."
openssl x509 -in "$SSL_DIR/self-signed.crt" -text -noout | head -20

echo ""
echo "✅ SSL certificates generated successfully!"
echo ""
echo "Files created:"
echo "  - $SSL_DIR/self-signed.key (private key)"
echo "  - $SSL_DIR/self-signed.crt (certificate)"
echo ""
echo "⚠️  These are self-signed certificates for development only."
echo "    Your browser will show a security warning - this is expected."
echo ""
echo "To trust the certificate on macOS:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $SSL_DIR/self-signed.crt"
echo ""
