
import java.time.LocalDateTime;
import java.time.Duration;

public class ParkingArray {

    static class Vehicle {
        String vehicleNumber;
        LocalDateTime entryTime;

        Vehicle(String vehicleNumber) {
            this.vehicleNumber = vehicleNumber;
            this.entryTime = LocalDateTime.now();
        }
    }

    private Vehicle[] vehicles = new Vehicle[20];

    public synchronized boolean park(String number) {
        for (Vehicle v : vehicles) {
            if (v != null &&
                v.vehicleNumber.equalsIgnoreCase(number)) {
                return false;
            }
        }

        for (int i = 0; i < vehicles.length; i++) {
            if (vehicles[i] == null) {
                vehicles[i] = new Vehicle(number);
                return true;
            }
        }

        return false;
    }

    public synchronized long remove(String number) {
        for (int i = 0; i < vehicles.length; i++) {
            if (vehicles[i] != null &&
                vehicles[i].vehicleNumber.equalsIgnoreCase(number)) {

                long minutes = Duration.between(
                    vehicles[i].entryTime,
                    LocalDateTime.now()
                ).toMinutes();

                long hours = Math.max(1, (minutes + 59) / 60);

                vehicles[i] = null;
                return hours * 30;
            }
        }

        return -1;
    }

    // Search for a vehicle that is currently parked
    public synchronized boolean containsVehicle(String number) {
        if (number == null || number.trim().isEmpty()) {
            return false;
        }

        for (Vehicle v : vehicles) {
            if (v != null &&
                v.vehicleNumber.equalsIgnoreCase(number.trim())) {
                return true;
            }
        }

        return false;
    }

    public synchronized Vehicle[] getVehicles() {
        return vehicles.clone();
    }

    public synchronized int occupiedSlots() {
        int count = 0;

        for (Vehicle v : vehicles) {
            if (v != null) {
                count++;
            }
        }

        return count;
    }

    public int availableSlots() {
        return vehicles.length - occupiedSlots();
    }
}
