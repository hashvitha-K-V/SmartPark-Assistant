
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class ParkingService {

    private ParkingArray parking = new ParkingArray();

    public String parkVehicle(String number) {
        if (number == null || number.trim().isEmpty()) {
            return "Enter a vehicle number.";
        }

        boolean success = parking.park(number.trim());

        if (success) {
            return "Vehicle parked successfully!";
        }

        return "Parking full or vehicle already parked.";
    }

    public String removeVehicle(String number) {
        if (number == null || number.trim().isEmpty()) {
            return "Enter a vehicle number.";
        }

        long fee = parking.remove(number.trim());

        if (fee == -1) {
            return "Vehicle not found.";
        }

        return "Vehicle removed. Parking fee: ₹" + fee;
    }

    // Check the current parking status
    public String searchVehicle(String number) {
        if (number == null || number.trim().isEmpty()) {
            return "Please enter a vehicle number.";
        }

        String vehicleNumber = number.trim();

        if (parking.containsVehicle(vehicleNumber)) {
            return "Vehicle " + vehicleNumber +
                   " is currently parked in SmartPark.";
        }

        return "Vehicle " + vehicleNumber +
               " is not currently parked. Vehicle not found.";
    }

    public int getOccupiedSlots() {
        return parking.occupiedSlots();
    }

    public int getAvailableSlots() {
        return parking.availableSlots();
    }

    public List<String[]> getVehicleDetails() {
        List<String[]> list = new ArrayList<>();

        DateTimeFormatter format =
                DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");

        for (ParkingArray.Vehicle v : parking.getVehicles()) {
            if (v != null) {
                list.add(new String[] {
                    v.vehicleNumber,
                    v.entryTime.format(format)
                });
            }
        }

        return list;
    }
}
