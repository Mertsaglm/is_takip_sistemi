#!/bin/bash

echo "========================================"
echo "   İŞ TAKİP SİSTEMİ BAŞLATILIYOR..."
echo "========================================"
echo ""

# Script'in bulunduğu dizine git
cd "$(dirname "$0")"

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo "HATA: Node.js yüklü değil!"
    echo "Lütfen nodejs.org adresinden Node.js yükleyin."
    read -p "Devam etmek için Enter'a basın..."
    exit 1
fi

echo "Node.js versiyonu: $(node --version)"
echo ""

# İlk kurulum kontrolü
if [ ! -d "node_modules" ]; then
    echo "İlk kurulum yapılıyor... (Bu sadece bir kere olacak)"
    npm install
fi

echo ""
echo "Uygulama başlatılıyor..."
echo "Tarayıcı otomatik açılacak: http://localhost:3000"
echo ""
echo "KAPATMAK İÇİN: Bu pencereyi kapatın veya Ctrl+C basın"
echo ""

# 3 saniye bekle
sleep 3

# Tarayıcıyı aç
open http://localhost:3000

# Uygulamayı başlat
npm run dev
