# Fullstack Engineer Task

## Task Description

You need to create a fullstack TypeScript application using **React** and **Express** with **PostgreSQL** that displays the events fetched from the **Google Calendar API**: [Google Calendar API Docs](https://developers.google.com/calendar/v3/reference/)

The frontend application should include:

- Login page
- Main page with content

The backend should handle:

- Google OAuth authentication
- Fetching and storing events from the Google Calendar API
- Creating the events

## Required Functionality

- **Google OAuth Login** on the initial page.

  - After a successful login, redirect the user to the main page.
  - Store the user’s access token and refresh token securely for future API requests.
  - Fetch and store the user’s calendar events in the database going back and forward six months.

- On the **main page**, display events from the user’s calendar in a **list** format.

  - Each event should show:

    - Name
    - Start date and time
    - End date and time

  - For simplicity, assume all events start and end on the same day.

- Events must be:

  - Sorted by start time
  - Grouped by day
  - The layout doesn’t need to mimic Google Calendar – just a clean list view is fine.

- By default, show events for the **next 7 days** starting from the current day.

  - Users should be able to switch the date range to **1, 7, or 30 days**.
  - If the range is set to **30 days**, events should be grouped by **weeks** instead of days.

- There needs to be a button on the frontend that allows the user to **refresh** the events from the Google Calendar API. All the events should be fetched from the API, stored in the database and displayed on the main page. If the user creates a new event, the frontend should reflect these changes immediately and those changes should be saved in the database and created in the Google Calendar.

---

## Additional Features

- Support for **adding** new events

  - Creating an event should be kept simple:

    - Name
    - Date
    - Start and end time
    - Ignore options like location, participants, recurring settings, etc.

- The interface for adding events can:

  - Be embedded on the main page
  - Be on a separate page
  - Or be implemented in another way — your choice

> **Notes**:
> · Design and UI are not a priority.
> · Be mindful of the commit history and ensure your code is clean and well-structured.
> · Make sure to include a README file with instructions on how to run the application.
> · Include any additional notes or comments that may help us understand your code better.
> · Make the project as production-ready as possible.

## Submission

Submit your solution as a **URL to your Git repository**.

**Good luck!**
