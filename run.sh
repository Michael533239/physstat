gnome-terminal --tab --title="Server" -- bash -c "cd server && sudo npm run dev; exec bash"
gnome-terminal --tab --title="Client" -- bash -c "cd client && npm run dev; exec bash"
