#!/bin/bash

# Island Bitcoin - Manage IP Whitelist
# This script helps manage whitelisted IPs for rate limiting

echo "🔧 Island Bitcoin - IP Whitelist Manager"
echo "========================================"
echo ""

# Function to show current whitelist
show_whitelist() {
    if [ -f .env ]; then
        CURRENT=$(grep "^WHITELISTED_IPS=" .env | cut -d '=' -f2-)
        if [ -z "$CURRENT" ]; then
            echo "No IPs currently whitelisted"
        else
            echo "Currently whitelisted IPs:"
            echo "$CURRENT" | tr ',' '\n' | while read ip; do
                echo "  - $ip"
            done
        fi
    else
        echo "❌ No .env file found"
    fi
}

# Function to add IP to whitelist
add_ip() {
    local NEW_IP=$1
    
    if [ -z "$NEW_IP" ]; then
        read -p "Enter IP to whitelist: " NEW_IP
    fi
    
    if [ -f .env ]; then
        # Check if WHITELISTED_IPS exists
        if grep -q "^WHITELISTED_IPS=" .env; then
            # Get current IPs
            CURRENT=$(grep "^WHITELISTED_IPS=" .env | cut -d '=' -f2-)
            if [ -z "$CURRENT" ]; then
                # Empty list, just add the IP
                sed -i "s/^WHITELISTED_IPS=.*/WHITELISTED_IPS=$NEW_IP/" .env
            else
                # Check if IP already exists
                if echo "$CURRENT" | grep -q "$NEW_IP"; then
                    echo "⚠️  IP $NEW_IP is already whitelisted"
                else
                    # Append to existing list
                    sed -i "s/^WHITELISTED_IPS=.*/WHITELISTED_IPS=$CURRENT,$NEW_IP/" .env
                    echo "✅ Added $NEW_IP to whitelist"
                fi
            fi
        else
            # Add new line
            echo "WHITELISTED_IPS=$NEW_IP" >> .env
            echo "✅ Added $NEW_IP to whitelist"
        fi
    else
        echo "❌ No .env file found"
    fi
}

# Function to remove IP from whitelist
remove_ip() {
    local REMOVE_IP=$1
    
    if [ -z "$REMOVE_IP" ]; then
        show_whitelist
        echo ""
        read -p "Enter IP to remove: " REMOVE_IP
    fi
    
    if [ -f .env ]; then
        if grep -q "^WHITELISTED_IPS=" .env; then
            CURRENT=$(grep "^WHITELISTED_IPS=" .env | cut -d '=' -f2-)
            # Remove the IP and clean up commas
            NEW_LIST=$(echo "$CURRENT" | sed "s/$REMOVE_IP//g" | sed 's/,,/,/g' | sed 's/^,//g' | sed 's/,$//g')
            sed -i "s/^WHITELISTED_IPS=.*/WHITELISTED_IPS=$NEW_LIST/" .env
            echo "✅ Removed $REMOVE_IP from whitelist"
        fi
    fi
}

# Function to find your current IP
find_my_ip() {
    echo "🔍 Finding your public IP..."
    MY_IP=$(curl -s ifconfig.me)
    echo "Your public IP is: $MY_IP"
    echo ""
    read -p "Add this IP to whitelist? (y/n): " ADD_IT
    if [ "$ADD_IT" = "y" ]; then
        add_ip "$MY_IP"
    fi
}

# Function to check logs for rate-limited IPs
check_logs() {
    echo "🔍 Checking for rate-limited IPs in logs..."
    echo ""
    
    if command -v docker &> /dev/null; then
        echo "Recent rate limit messages:"
        docker compose logs app 2>/dev/null | grep -i "too many requests" | tail -10
        
        echo ""
        echo "Unique IPs that hit rate limits:"
        docker compose logs app 2>/dev/null | grep -oE 'from [0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | sort -u
    else
        echo "Docker not found, checking system logs..."
        journalctl -u nginx --since "1 hour ago" | grep -i "too many" || echo "No rate limit logs found"
    fi
}

# Main menu
while true; do
    echo ""
    echo "What would you like to do?"
    echo "1) Show current whitelist"
    echo "2) Add IP to whitelist"
    echo "3) Remove IP from whitelist"
    echo "4) Find my current IP"
    echo "5) Check logs for rate-limited IPs"
    echo "6) Restart application (apply changes)"
    echo "7) Exit"
    echo ""
    read -p "Select option (1-7): " CHOICE
    
    case $CHOICE in
        1)
            show_whitelist
            ;;
        2)
            add_ip
            ;;
        3)
            remove_ip
            ;;
        4)
            find_my_ip
            ;;
        5)
            check_logs
            ;;
        6)
            echo "🔄 Restarting application..."
            docker compose restart app
            echo "✅ Application restarted"
            ;;
        7)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option"
            ;;
    esac
done