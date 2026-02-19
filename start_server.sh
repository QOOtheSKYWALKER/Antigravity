#!/bin/bash

# ポート番号（デフォルト: 8000）
PORT=${1:-8000}

# Pythonのバージョン確認とサーバー起動
if command -v python3 &>/dev/null; then
    echo "Starting Python 3 HTTP server on port $PORT..."
    echo "Access the app at: http://localhost:$PORT/sudoku/"
    python3 -m http.server "$PORT"
elif command -v python &>/dev/null; then
    echo "Starting Python 2 HTTP server on port $PORT..."
    echo "Access the app at: http://localhost:$PORT/sudoku/"
    python -m SimpleHTTPServer "$PORT"
else
    echo "Python is not installed. Please install Python to use this script."
    exit 1
fi
