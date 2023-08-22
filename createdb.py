@app.cli.command("initdb")
def initdb_command():
    """Initialize the database."""
    initialize_db()
    print("Database has been initialized.")

