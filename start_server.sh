#!/bin/bash
echo "Starting local server for Sudoku..."
echo "Open http://localhost:8000/sudoku/index.html in your browser."
python3 -m http.server 8000
