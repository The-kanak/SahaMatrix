package com.sahamatrix.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "phcs")
public class PhcEntity {

    @Id
    @Column(length = 30)
    private String id; // 'phc-up-01'

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "state_code", nullable = false, length = 5)
    private String state;

    @Column(nullable = false, length = 50)
    private String district;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    @Column(name = "beds_total")
    private Integer bedsTotal;

    @Column(name = "beds_occupied")
    private Integer bedsOccupied;

    @Column(name = "staff_total")
    private Integer staffTotal;

    @Column(name = "staff_present")
    private Integer staffPresent;

    public PhcEntity() {}

    public PhcEntity(String id, String name, String state, String district,
                     Double lat, Double lng, Integer bedsTotal, Integer bedsOccupied,
                     Integer staffTotal, Integer staffPresent) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.district = district;
        this.lat = lat;
        this.lng = lng;
        this.bedsTotal = bedsTotal;
        this.bedsOccupied = bedsOccupied;
        this.staffTotal = staffTotal;
        this.staffPresent = staffPresent;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public Integer getBedsTotal() {
        return bedsTotal;
    }

    public void setBedsTotal(Integer bedsTotal) {
        this.bedsTotal = bedsTotal;
    }

    public Integer getBedsOccupied() {
        return bedsOccupied;
    }

    public void setBedsOccupied(Integer bedsOccupied) {
        this.bedsOccupied = bedsOccupied;
    }

    public Integer getStaffTotal() {
        return staffTotal;
    }

    public void setStaffTotal(Integer staffTotal) {
        this.staffTotal = staffTotal;
    }

    public Integer getStaffPresent() {
        return staffPresent;
    }

    public void setStaffPresent(Integer staffPresent) {
        this.staffPresent = staffPresent;
    }
}
