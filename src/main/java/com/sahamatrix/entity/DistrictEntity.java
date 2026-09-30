package com.sahamatrix.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "districts")
public class DistrictEntity {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "state_code", nullable = false, length = 5)
    private String stateCode;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "center_lat")
    private Double centerLat;

    @Column(name = "center_lng")
    private Double centerLng;

    public DistrictEntity() {}

    public DistrictEntity(String id, String stateCode, String name, Double centerLat, Double centerLng) {
        this.id = id;
        this.stateCode = stateCode;
        this.name = name;
        this.centerLat = centerLat;
        this.centerLng = centerLng;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStateCode() {
        return stateCode;
    }

    public void setStateCode(String stateCode) {
        this.stateCode = stateCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getCenterLat() {
        return centerLat;
    }

    public void setCenterLat(Double centerLat) {
        this.centerLat = centerLat;
    }

    public Double getCenterLng() {
        return centerLng;
    }

    public void setCenterLng(Double centerLng) {
        this.centerLng = centerLng;
    }
}
