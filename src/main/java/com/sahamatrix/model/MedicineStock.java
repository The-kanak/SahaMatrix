package com.sahamatrix.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MedicineStock {
    private final String medicine;
    private double quantity;
    private final List<DailyConsumption> history;

    public MedicineStock(String medicine, double quantity, List<DailyConsumption> history) {
        this.medicine = medicine;
        this.quantity = quantity;
        this.history = new ArrayList<>(history);
    }

    // Copy constructor for simulation and non-mutating projections
    public MedicineStock(MedicineStock other) {
        this.medicine = other.medicine;
        this.quantity = other.quantity;
        this.history = new ArrayList<>(other.history);
    }

    public String getMedicine() {
        return medicine;
    }

    public synchronized double getQuantity() {
        return quantity;
    }

    public synchronized void setQuantity(double quantity) {
        this.quantity = Math.max(0.0, quantity);
    }

    public synchronized void addQuantity(double delta) {
        this.quantity = Math.max(0.0, this.quantity + delta);
    }

    public synchronized List<DailyConsumption> getHistory() {
        return Collections.unmodifiableList(new ArrayList<>(history));
    }

    public synchronized void addConsumption(DailyConsumption consumption) {
        this.history.add(consumption);
    }
}
