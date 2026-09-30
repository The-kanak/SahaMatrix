package com.sahamatrix.model;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class PHC {
    private final String id;
    private final String name;
    private final String state;
    private final String district;
    private final double lat;
    private final double lng;
    private final int bedsTotal;
    private final int bedsOccupied;
    private final int staffPresent;
    private final int staffTotal;
    private final Map<String, MedicineStock> stockMap;

    public PHC(String id, String name, String state, String district,
               double lat, double lng, int bedsTotal, int bedsOccupied,
               int staffPresent, int staffTotal, Map<String, MedicineStock> stockMap) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.district = district;
        this.lat = lat;
        this.lng = lng;
        this.bedsTotal = bedsTotal;
        this.bedsOccupied = bedsOccupied;
        this.staffPresent = staffPresent;
        this.staffTotal = staffTotal;
        this.stockMap = new LinkedHashMap<>(stockMap);
    }

    // Copy constructor for non-mutating projections and scale testing
    public PHC(PHC other) {
        this.id = other.id;
        this.name = other.name;
        this.state = other.state;
        this.district = other.district;
        this.lat = other.lat;
        this.lng = other.lng;
        this.bedsTotal = other.bedsTotal;
        this.bedsOccupied = other.bedsOccupied;
        this.staffPresent = other.staffPresent;
        this.staffTotal = other.staffTotal;
        this.stockMap = new LinkedHashMap<>();
        for (Map.Entry<String, MedicineStock> entry : other.stockMap.entrySet()) {
            this.stockMap.put(entry.getKey(), new MedicineStock(entry.getValue()));
        }
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getState() {
        return state;
    }

    public String getDistrict() {
        return district;
    }

    public double getLat() {
        return lat;
    }

    public double getLng() {
        return lng;
    }

    public int getBedsTotal() {
        return bedsTotal;
    }

    public int getBedsOccupied() {
        return bedsOccupied;
    }

    public int getStaffPresent() {
        return staffPresent;
    }

    public int getStaffTotal() {
        return staffTotal;
    }

    public Map<String, MedicineStock> getStockMap() {
        return Collections.unmodifiableMap(stockMap);
    }

    public MedicineStock getMedicineStock(String medicine) {
        return stockMap.get(medicine);
    }
}
