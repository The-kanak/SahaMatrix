package com.sahamatrix.repository;

import com.sahamatrix.entity.DistrictEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DistrictRepository extends JpaRepository<DistrictEntity, String> {
    List<DistrictEntity> findByStateCode(String stateCode);
}
