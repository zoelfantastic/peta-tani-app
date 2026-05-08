import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';

/// Main app shell with custom bottom navigation bar and FAB.
/// The FAB ("+ Catat") is the primary action — always accessible in 1 tap.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  static const _tabs = [
    _TabItem(path: '/beranda', label: 'Beranda', icon: Icons.home_rounded),
    _TabItem(path: '/lahan', label: 'Lahan', icon: Icons.map_rounded),
    _TabItem(
      path: '/catat',
      label: 'Catat',
      icon: Icons.add_circle_rounded,
    ), // placeholder for FAB gap
    _TabItem(
      path: '/riwayat',
      label: 'Riwayat',
      icon: Icons.access_time_rounded,
    ),
    _TabItem(path: '/profil', label: 'Profil', icon: Icons.person_rounded),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex(context);

    return Scaffold(
      body: child,
      extendBody: true,
      floatingActionButton: _buildFAB(context, currentIndex == 2),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: _buildBottomBar(context, currentIndex),
    );
  }

  Widget _buildFAB(BuildContext context, bool isActive) {
    return Container(
      height: 60,
      width: 60,
      margin: const EdgeInsets.only(top: 24),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isActive
              ? [AppColors.accent, AppColors.accent.withAlpha(200)]
              : [AppColors.accent, const Color(0xFFD4533B)],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withAlpha(100),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: FloatingActionButton(
        onPressed: () => context.go('/catat'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        shape: const CircleBorder(),
        child: const Icon(Icons.add_rounded, size: 30, color: Colors.white),
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, int currentIndex) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(15),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          height: 64,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_tabs.length, (index) {
              if (index == 2) {
                // Center gap for FAB
                return const SizedBox(width: 56);
              }

              final tab = _tabs[index];
              final isSelected = currentIndex == index;

              return _NavBarItem(
                icon: tab.icon,
                label: tab.label,
                isSelected: isSelected,
                onTap: () => context.go(tab.path),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _NavBarItem extends StatelessWidget {
  const _NavBarItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primary.withAlpha(25)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                icon,
                size: 24,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabItem {
  const _TabItem({required this.path, required this.label, required this.icon});

  final String path;
  final String label;
  final IconData icon;
}
