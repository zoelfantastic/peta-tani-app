from firebase_functions.options import set_global_options
from firebase_admin import initialize_app

set_global_options(max_instances=10)
initialize_app()

# Auth & profil petani
from handlers.auth import setup_profil, update_profil, update_notif_settings  # noqa: F401, E402

# Manajemen lahan
from handlers.lahan import (  # noqa: F401, E402
    tambah_lahan,
    edit_lahan,
    hapus_lahan,
    get_lahan_list,
    get_detail_lahan,
)

# Catat & riwayat aktivitas
from handlers.aktivitas import (  # noqa: F401, E402
    catat_aktivitas,
    edit_aktivitas,
    hapus_aktivitas,
    get_riwayat,
)

# Data Beranda (stats + pengingat + aktivitas terbaru)
from handlers.beranda import get_beranda_data  # noqa: F401, E402

# Admin dashboard
from handlers.admin import (  # noqa: F401, E402
    get_dashboard_kpi,
    get_daftar_petani,
    get_detail_petani,
    get_daftar_aktivitas,
    get_analitik,
    generate_laporan,
)

# Pengingat & scheduler harian
from handlers.reminders import (  # noqa: F401, E402
    tambah_reminder,
    selesaikan_reminder,
    kirim_pengingat_harian,
)
