/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Router — Клиентская маршрутизация SPA
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.onRouteChange = null;
        
        // Слушаем popstate для навигации по истории
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigate(e.state.page, false);
            }
        });
    }
    
    /**
     * Регистрирует маршрут
     */
    register(path, handler) {
        this.routes.set(path, handler);
    }
    
    /**
     * Навигация к странице
     */
    navigate(page, pushState = true) {
        if (this.currentRoute === page) return;
        
        const handler = this.routes.get(page);
        
        if (handler) {
            this.currentRoute = page;
            
            if (pushState) {
                history.pushState({ page }, '', `#${page}`);
            }
            
            handler();
            
            if (this.onRouteChange) {
                this.onRouteChange(page);
            }
        }
    }
    
    /**
     * Получает текущий маршрут из URL
     */
    getCurrentRoute() {
        const hash = window.location.hash.slice(1);
        return hash || 'home';
    }
    
    /**
     * Инициализация с начальным маршрутом
     */
    init() {
        const route = this.getCurrentRoute();
        this.navigate(route, false);
    }
}
