const WAREHOUSE_ZONES = {
  STANDARD: "ZONE_STANDARD",
  COLD: "ZONE_COLD",
  FRAGILE: "ZONE_FRAGILE",
};

const MAX_PAYLOAD_CAPACITY = 5000;
const WARNING_THRESHOLD = MAX_PAYLOAD_CAPACITY * 0.85;

const cargoWarehouseDB = [];

function determineZone(cargoType) {
  const type = cargoType.toUpperCase();
  if (type === "COLD" || type === "FOOD") return WAREHOUSE_ZONES.COLD;
  if (type === "FRAGILE" || type === "ELECTRONICS" || type === "GLASS")
    return WAREHOUSE_ZONES.FRAGILE;
  return WAREHOUSE_ZONES.STANDARD;
}

function calculateTotalCargoWeight(db) {
  return db.reduce((sum, item) => sum + item.weight, 0);
}

function addCargoItem(db, item) {
  if (
    !item.id ||
    !item.name ||
    typeof item.weight !== "number" ||
    item.weight <= 0
  ) {
    throw new Error("Thông tin kiện hàng không hợp lệ!");
  }

  if (db.some((c) => c.id === item.id)) {
    throw new Error(`Mã kiện hàng "${item.id}" đã tồn tại trong kho!`);
  }

  const currentTotalWeight = calculateTotalCargoWeight(db);
  if (currentTotalWeight + item.weight > MAX_PAYLOAD_CAPACITY) {
    throw new Error(
      `[Từ chối] Vượt quá giới hạn tải trọng an toàn chuyến bay (${MAX_PAYLOAD_CAPACITY} kg)!`,
    );
  }

  const zone = determineZone(item.cargoType);
  const cargoItem = {
    id: item.id.toUpperCase(),
    name: item.name,
    weight: item.weight,
    cargoType: item.cargoType.toUpperCase(),
    zone: zone,
  };

  db.push(cargoItem);

  const newTotal = currentTotalWeight + cargoItem.weight;
  let message = `Đã nhập kiện hàng ${cargoItem.id} vào phân khu ${zone}.`;
  if (newTotal > WARNING_THRESHOLD) {
    message += ` [CẢNH BÁO] Tổng tải trọng đã vượt mức 85% (${newTotal}/${MAX_PAYLOAD_CAPACITY} kg)!`;
  }
  return message;
}

function getInventoryByZone(db, zone) {
  return db.filter((item) => item.zone === zone);
}

function checkPayloadStatus(db) {
  const totalWeight = calculateTotalCargoWeight(db);
  const percentage = (totalWeight / MAX_PAYLOAD_CAPACITY) * 100;

  let status = "AN TOÀN";
  if (totalWeight > MAX_PAYLOAD_CAPACITY) {
    status = "QUÁ TẢI (VI PHẠM)";
  } else if (totalWeight > WARNING_THRESHOLD) {
    status = "CẢNH BÁO (VƯỢT 85%)";
  }

  return {
    totalWeight,
    maxCapacity: MAX_PAYLOAD_CAPACITY,
    percentage: percentage.toFixed(2),
    status,
  };
}

function generateCargoManifest(db) {
  console.log("\n==================================================");
  console.log("          CARGO MANIFEST - FLIGHT VN-210          ");
  console.log("==================================================");
  if (db.length === 0) {
    console.log("Kho hàng trống. Không có hàng hóa bốc dỡ.");
  } else {
    db.forEach((item, index) => {
      console.log(
        `${index + 1}. Mã: ${item.id} | Tên: ${item.name} | TL: ${item.weight}kg | Khu: ${item.zone}`,
      );
    });
    const total = calculateTotalCargoWeight(db);
    console.log("--------------------------------------------------");
    console.log(` TỔNG SỐ KIỆN: ${db.length} | TỔNG TRỌNG LƯỢNG: ${total} kg`);
  }
  console.log("==================================================\n");
}

function handleMenuChoice(choice, payload) {
  switch (choice) {
    case "1":
      try {
        const result = addCargoItem(cargoWarehouseDB, payload);
        console.log(result);
      } catch (err) {
        console.error(`[Lỗi] ${err.message}`);
      }
      break;

    case "2":
      const targetZone = payload.zone
        ? payload.zone.toUpperCase()
        : WAREHOUSE_ZONES.STANDARD;
      const itemsInZone = getInventoryByZone(cargoWarehouseDB, targetZone);
      console.log(`\n--- KIỂM KÊ PHÂN KHU: ${targetZone} ---`);
      if (itemsInZone.length === 0) {
        console.log("Không có kiện hàng nào trong phân khu này.");
      } else {
        itemsInZone.forEach((item, i) => {
          console.log(
            `${i + 1}. [${item.id}] ${item.name} - Trọng lượng: ${item.weight}kg`,
          );
        });
      }
      break;

    case "3":
      const statusInfo = checkPayloadStatus(cargoWarehouseDB);
      console.log("\n--- TRẠNG THÁI TẢI TRỌNG MÁY BAY ---");
      console.log(
        ` Tổng trọng lượng : ${statusInfo.totalWeight} / ${statusInfo.maxCapacity} kg`,
      );
      console.log(` Tỷ lệ sử dụng    : ${statusInfo.percentage}%`);
      console.log(` Trạng thái       : ${statusInfo.status}`);
      break;

    case "4":
      generateCargoManifest(cargoWarehouseDB);
      break;

    case "0":
      console.log("Thoát chương trình quản lý kho hàng.");
      break;

    default:
      console.log("Lựa chọn không hợp lệ! Vui lòng chọn từ 0 đến 4.");
  }
}
