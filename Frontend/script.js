const TOTAL_SLOTS = 20;

const pageInfo = {
    dashboard: ["Dashboard Overview", "Monitor your parking space in real time."],
    park: ["Park Vehicle", "Register a new vehicle in your parking area."],
    remove: ["Remove Vehicle", "Complete a parking session and calculate the fee."],
    search: ["Search Vehicle", "Check whether a vehicle is currently parked."],
    parking: ["Parking Records", "View all vehicles currently in the parking area."]
};

// Show final messages in the popup instead of below the form.
function showMessage(message, target = "message") {
    const element = document.getElementById(target);
    const cleanMessage = String(message || "").trim();

    if (element) {
        element.textContent = "";
    }

    if (!cleanMessage) {
        closeSmartPopup();
        return;
    }

    // Keep temporary loading messages inline.
    if (/^(processing|searching)\b/i.test(cleanMessage)) {
        if (element) {
            element.textContent = cleanMessage;
        }
        return;
    }

    showSmartPopup(cleanMessage);
}

// Display the SmartPark popup.
function showSmartPopup(message) {
    const popup = document.getElementById("smartPopup");
    const title = document.getElementById("popupTitle");
    const text = document.getElementById("popupMessage");
    const icon = document.getElementById("popupIcon");

    if (!popup || !title || !text || !icon) return;

    text.textContent = message;

    if (/parking fee:/i.test(message)) {
        title.textContent = "Vehicle Exit Complete!";
        icon.textContent = "✓";
        icon.style.background = "#e2fbf0";
        icon.style.color = "#0a9b70";
    } else if (/successfully/i.test(message)) {
        title.textContent = "Success!";
        icon.textContent = "✓";
        icon.style.background = "#e2fbf0";
        icon.style.color = "#0a9b70";
    } else if (/not found|not currently parked/i.test(message)) {
        title.textContent = "Vehicle Not Found";
        icon.textContent = "⌕";
        icon.style.background = "#eeebff";
        icon.style.color = "#7357ed";
    } else if (/failed|error|full|unable|already parked/i.test(message)) {
        title.textContent = "Parking Alert";
        icon.textContent = "!";
        icon.style.background = "#ffedf1";
        icon.style.color = "#e65e7c";
    } else {
        title.textContent = "SmartPark Notification";
        icon.textContent = "i";
        icon.style.background = "#eeebff";
        icon.style.color = "#7357ed";
    }

    popup.classList.add("show");
    popup.setAttribute("aria-hidden", "false");

    const okButton = document.getElementById("popupOk");
    if (okButton) okButton.focus();
}

// Close the popup.
function closeSmartPopup() {
    const popup = document.getElementById("smartPopup");

    if (!popup) return;

    popup.classList.remove("show");
    popup.setAttribute("aria-hidden", "true");
}

// OK button closes the popup.
document.getElementById("popupOk").addEventListener("click", function () {
    closeSmartPopup();
});

// Clicking outside the popup also closes it.
document.getElementById("smartPopup").addEventListener("click", function (event) {
    if (event.target === this) {
        closeSmartPopup();
    }
});

// Escape key closes the popup.
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeSmartPopup();
    }
});

// Navigate between pages.
function navigateToPage() {
    const requested = location.hash.replace("#", "") || "dashboard";
    const page = pageInfo[requested] ? requested : "dashboard";

    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle("active", section.id === "page-" + page);
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === page);
    });

    document.getElementById("pageTitle").textContent = pageInfo[page][0];
    document.getElementById("pageSubtitle").textContent = pageInfo[page][1];

    showMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (page === "parking" || page === "dashboard") {
        loadVehicles();
    }
}

window.addEventListener("hashchange", navigateToPage);

// Send vehicle numbers to the Java backend.
async function sendVehicleRequest(endpoint, vehicleNumber) {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleNumber })
    });

    if (!response.ok) {
        throw new Error("HTTP " + response.status + " from " + endpoint);
    }

    return await response.json();
}

// Park a vehicle.
async function parkVehicle(event) {
    event.preventDefault();

    const input = document.getElementById("vehicleNumber");
    const vehicleNumber = input.value.trim().toUpperCase();

    if (!vehicleNumber) {
        showMessage("Please enter a vehicle number.", "parkMessage");
        return;
    }

    showMessage("Processing parking request...", "parkMessage");

    try {
        const result = await sendVehicleRequest("/park", vehicleNumber);
        const message = result.message || "Parking request completed.";

        showMessage(message, "parkMessage");

        if (message.toLowerCase().includes("successfully")) {
            input.value = "";
        }

        await loadVehicles();
    } catch (error) {
        console.error("Park vehicle error:", error);

        showMessage(
            "Parking request failed. Check the Java server and try again.",
            "parkMessage"
        );
    }
}

// Remove a vehicle and display its fee.
async function removeVehicle(event) {
    event.preventDefault();

    const input = document.getElementById("removeNumber");
    const vehicleNumber = input.value.trim().toUpperCase();

    if (!vehicleNumber) {
        showMessage("Please enter a vehicle number.", "removeMessage");
        return;
    }

    showMessage("Processing vehicle removal...", "removeMessage");

    try {
        const result = await sendVehicleRequest("/remove", vehicleNumber);
        const message = result.message || "Removal request completed.";

        showMessage(message, "removeMessage");

        if (/parking fee:/i.test(message)) {
            input.value = "";
        }

        await loadVehicles();
    } catch (error) {
        console.error("Remove vehicle error:", error);

        showMessage(
            "Removal request failed. Check the Java server and try again.",
            "removeMessage"
        );
    }
}

// Search for a currently parked vehicle.
async function searchVehicle(event) {
    event.preventDefault();

    const input = document.getElementById("searchNumber");
    const vehicleNumber = input.value.trim().toUpperCase();

    if (!vehicleNumber) {
        showMessage("Please enter a vehicle number.", "searchMessage");
        return;
    }

    const button = document.querySelector("#searchForm button");
    if (button) button.disabled = true;

    showMessage("Searching for " + vehicleNumber + "...", "searchMessage");

    try {
        const result = await sendVehicleRequest("/search", vehicleNumber);

        if (result.message) {
            showMessage(result.message, "searchMessage");
        } else {
            showMessage("The server returned no search result.", "searchMessage");
        }

        await loadVehicles();
    } catch (error) {
        console.error("Search vehicle error:", error);

        showMessage(
            "Search request failed (" + error.message +
            "). Please check the Java server.",
            "searchMessage"
        );
    } finally {
        if (button) button.disabled = false;
    }
}

// Load parking records and refresh the dashboard.
async function loadVehicles() {
    try {
        const response = await fetch("/vehicles");

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
        const occupied = Number(data.occupied ?? vehicles.length);
        const available = Number(
            data.available ?? Math.max(0, TOTAL_SLOTS - occupied)
        );

        document.getElementById("totalSlots").textContent = TOTAL_SLOTS;
        document.getElementById("occupiedSlots").textContent = occupied;
        document.getElementById("availableSlots").textContent = available;

        document.getElementById("recordTotal").textContent = occupied;
        document.getElementById("recordAvailable").textContent = available;
        document.getElementById("parkAvailable").textContent = available;

        document.getElementById("recordCount").textContent =
            occupied + (occupied === 1 ? " vehicle" : " vehicles");

        // Update all 20 parking slots.
        const grid = document.getElementById("slotGrid");
        grid.replaceChildren();

        for (let i = 0; i < TOTAL_SLOTS; i++) {
            const vehicle = vehicles[i];
            const slot = document.createElement("div");

            slot.className = vehicle
                ? "parking-slot occupied"
                : "parking-slot";

            const icon = document.createElement("div");
            icon.className = "slot-car";
            icon.textContent = vehicle ? "🚘" : "✓";

            const title = document.createElement("strong");
            title.textContent = "SLOT " + String(i + 1).padStart(2, "0");

            const detail = document.createElement("span");
            detail.textContent = vehicle
                ? vehicle.vehicleNumber
                : "Available";

            slot.append(icon, title, detail);
            grid.appendChild(slot);
        }

        // Update the parking records table.
        const list = document.getElementById("parkingList");
        list.replaceChildren();

        if (vehicles.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.className = "empty-state";
            cell.textContent = "No vehicles parked yet.";

            row.appendChild(cell);
            list.appendChild(row);
        } else {
            vehicles.forEach((vehicle, index) => {
                const row = document.createElement("tr");

                const slotCell = document.createElement("td");
                slotCell.textContent = "S-" + String(index + 1).padStart(2, "0");

                const numberCell = document.createElement("td");
                numberCell.textContent = vehicle.vehicleNumber || "Unknown";

                const timeCell = document.createElement("td");
                timeCell.textContent = vehicle.entryTime || "Not available";

                const statusCell = document.createElement("td");
                const badge = document.createElement("span");

                badge.className = "status-pill";
                badge.textContent = "Parked";

                statusCell.appendChild(badge);
                row.append(slotCell, numberCell, timeCell, statusCell);
                list.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Load parking records error:", error);

        showMessage(
            "Unable to load parking records. Check the Java server."
        );
    }
}

// Update the live clock.
function updateClock() {
    const clock = document.getElementById("liveClock");

    if (clock) {
        clock.textContent = new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }
}

// Connect all forms.
document.getElementById("parkForm").addEventListener("submit", parkVehicle);
document.getElementById("removeForm").addEventListener("submit", removeVehicle);
document.getElementById("searchForm").addEventListener("submit", searchVehicle);

// Start the application.
navigateToPage();
updateClock();
loadVehicles();

setInterval(updateClock, 1000);
setInterval(loadVehicles, 5000);
 