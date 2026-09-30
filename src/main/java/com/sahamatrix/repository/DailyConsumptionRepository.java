package com.sahamatrix.repository;

import com.sahamatrix.entity.DailyConsumptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyConsumptionRepository extends JpaRepository<DailyConsumptionEntity, Long> {
    List<DailyConsumptionEntity> findByPhcIdAndMedicineOrderByRecordDateAsc(String phcId, String medicine);
    void deleteByPhcId(String phcId);
}
