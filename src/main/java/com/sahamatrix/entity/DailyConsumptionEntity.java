package com.sahamatrix.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "daily_consumption", indexes = {
        @Index(name = "idx_phc_med_date", columnList = "phc_id, medicine, record_date")
})
public class DailyConsumptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phc_id", nullable = false, length = 30)
    private String phcId;

    @Column(nullable = false, length = 50)
    private String medicine;

    @Column(name = "record_date", nullable = false, length = 20)
    private String recordDate;

    @Column(nullable = false)
    private Double units;

    public DailyConsumptionEntity() {}

    public DailyConsumptionEntity(String phcId, String medicine, String recordDate, Double units) {
        this.phcId = phcId;
        this.medicine = medicine;
        this.recordDate = recordDate;
        this.units = units;
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

    public String getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(String recordDate) {
        this.recordDate = recordDate;
    }

    public Double getUnits() {
        return units;
    }

    public void setUnits(Double units) {
        this.units = units;
    }
}
