package com.sahamatrix.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "phc_stock", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"phc_id", "medicine"})
})
public class PhcStockEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phc_id", nullable = false, length = 30)
    private String phcId;

    @Column(nullable = false, length = 50)
    private String medicine;

    @Column(nullable = false)
    private Double quantity;

    public PhcStockEntity() {}

    public PhcStockEntity(String phcId, String medicine, Double quantity) {
        this.phcId = phcId;
        this.medicine = medicine;
        this.quantity = quantity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPhcId() {
        return phcId;
    }

    public void setPhcId(String phcId) {
        this.phcId = phcId;
    }

    public String getMedicine() {
        return medicine;
    }

    public void setMedicine(String medicine) {
        this.medicine = medicine;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }
}
