#!/bin/bash

# Script to get port information from PID
# Usage: ./get-port-from-pid.sh <PID>
# Or: ./get-port-from-pid.sh (it will prompt you)

if [ -z "$1" ]; then
    echo "Usage: $0 <PID>"
    echo ""
    echo "Or find PID first:"
    echo "  pm2 pid gelagle-stock-backend"
    echo ""
    echo "Then run: $0 <PID>"
    exit 1
fi

PID=$1

echo "Port information for PID: $PID"
echo "================================"
echo ""

# Method 1: Using lsof (most detailed)
echo "Method 1: Using lsof"
echo "--------------------"
if command -v lsof &> /dev/null; then
    lsof -Pan -p $PID -i | grep LISTEN || echo "No listening ports found"
else
    echo "lsof not installed. Install with: sudo apt install lsof"
fi
echo ""

# Method 2: Using netstat
echo "Method 2: Using netstat"
echo "-----------------------"
if command -v netstat &> /dev/null; then
    netstat -tlnp 2>/dev/null | grep $PID || echo "No ports found"
else
    echo "netstat not installed. Install with: sudo apt install net-tools"
fi
echo ""

# Method 3: Using ss (modern alternative)
echo "Method 3: Using ss (modern)"
echo "---------------------------"
if command -v ss &> /dev/null; then
    ss -tlnp 2>/dev/null | grep "pid=$PID" || echo "No ports found"
else
    echo "ss not available"
fi
echo ""

# Method 4: Get PM2 PID and port in one go
echo "Quick command for PM2 apps:"
echo "---------------------------"
echo "pm2 pid gelagle-stock-backend | xargs -I {} lsof -Pan -p {} -i"
echo ""









