# Seatpax — Fleet, Vehicle & Seat Template


> Modular documentation extracted from the Seatpax master specification.


# 12. Vehicle & Seat Template

## 12.1 Prinsip blueprint

Jangan membuat layout per vehicle satu-satu dari nol.

Arsitektur:

```text
SeatTemplate
    ↓
Vehicle
    ↓
Trip Snapshot / Inventory
```

Contoh:

```text
HiAce Premio 10 Seat
Bus Executive 32 Seat
Sleeper 18 Cabin
```

Vehicle cukup menunjuk template.

## 12.2 Kenapa template

- Menghindari duplikasi.
- Memudahkan puluhan vehicle memakai layout sama.
- Vehicle baru cukup assign template.
- Layout karoseri modif dapat dibuat dari duplicate template.

## 12.3 Visual Seat Builder

Pendekatan: **smart grid**, bukan koordinat pixel bebas.

Cell types minimal:

| Type | Fungsi |
|---|---|
| `SEAT` | Kursi passenger |
| `DRIVER` | Posisi driver |
| `AISLE` | Lorong |
| `DOOR` | Pintu |
| `EMPTY` | Area kosong |
| `FACILITY` | Meja/fasilitas opsional |

Contoh:

```text
┌──────┬──────┬──────┐
│DRIVER│AISLE │  01  │
├──────┼──────┼──────┤
│ DOOR │AISLE │  02  │
├──────┼──────┼──────┤
│  03  │  04  │  05  │
└──────┴──────┴──────┘
```

## 12.4 Duplicate & modify

Flow:

```text
HiAce Standard 10
      ↓ Duplicate
HiAce VIP 8
      ↓
remove / move / add cells
```

## 12.5 Seat numbering

Builder dapat mendukung auto-numbering dan manual override.

MVP tidak perlu freeform rotation/absolute positioning.

---
