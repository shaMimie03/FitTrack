class FitTrackApp {
    constructor() {
        this.state = {
            currentUser: null,
            isLoading: false,
            error: null,
            workouts: [],
            nutritionEntries: [],
            progressData: {},
            goals: {},
            authToken: null
        };

        this.domElements = {
            sections: {
                hero: document.getElementById('hero-section'),
                dashboard: document.getElementById('dashboard-section'),
                workout: document.getElementById('workout-section'),
                nutrition: document.getElementById('nutrition-section'),
                progress: document.getElementById('progress-section'),
                error: document.getElementById('error-section')
            },
            modals: {
                login: document.getElementById('login-screen'),
                signup: document.getElementById('signup-screen'),
                forgot: document.getElementById('forgot-screen'),
                addWorkout: new bootstrap.Modal(document.getElementById('addWorkoutModal')),
                addMeal: new bootstrap.Modal(document.getElementById('addMealModal'))
            },
            forms: {
                login: document.getElementById('login-form'),
                signup: document.getElementById('signup-form'),
                forgot: document.getElementById('forgot-form'),
                addWorkout: document.getElementById('add-workout-form'),
                addMeal: document.getElementById('add-meal-form')
            },
            containers: {
                workoutCards: document.getElementById('workout-cards-container'),
                workoutActivity: document.querySelector('#workout-activity-table tbody'),
                nutritionSummary: document.getElementById('nutrition-summary'),
                todayMeals: document.getElementById('today-meals-container'),
                measurements: document.querySelector('#measurements-table tbody'),
                achievements: document.getElementById('achievements-container')
            }
        };

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.checkAuthState();
        this.setupFormValidation();
    }

    loadData() {
        const savedState = localStorage.getItem('fitTrackState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                this.state = {
                    ...this.state,
                    ...parsedState,
                    currentUser: parsedState.currentUser || null,
                    authToken: parsedState.authToken || null
                };
            } catch (e) {
                console.error('Failed to parse saved state', e);
                localStorage.removeItem('fitTrackState');
            }
        } else {
            // Initialize with default data
            this.state = {
                ...this.state,
                workouts: [
                    {
                        id: this.generateId(),
                        name: "Morning Routine",
                        type: "Full Body",
                        duration: 15,
                        difficulty: "Beginner",
                        status: "Active",
                        createdAt: new Date().toISOString(),
                        calories: 120
                    },
                    {
                        id: this.generateId(),
                        name: "Strength Training",
                        type: "Upper Body",
                        duration: 45,
                        difficulty: "Intermediate",
                        status: "Paused",
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        calories: 280
                    },
                    {
                        id: this.generateId(),
                        name: "Yoga Flow",
                        type: "Flexibility",
                        duration: 30,
                        difficulty: "All Levels",
                        status: "Completed",
                        createdAt: new Date(Date.now() - 172800000).toISOString(),
                        calories: 150
                    }
                ],
                nutritionEntries: [
                    {
                        id: this.generateId(),
                        mealType: "Breakfast",
                        name: "Oatmeal with berries and almonds",
                        calories: 320,
                        protein: 10,
                        carbs: 45,
                        fats: 12,
                        time: "08:30",
                        date: new Date().toISOString()
                    },
                    {
                        id: this.generateId(),
                        mealType: "Lunch",
                        name: "Grilled chicken with quinoa and vegetables",
                        calories: 550,
                        protein: 35,
                        carbs: 40,
                        fats: 20,
                        time: "13:15",
                        date: new Date().toISOString()
                    },
                    {
                        id: this.generateId(),
                        mealType: "Snack",
                        name: "Greek yogurt with honey",
                        calories: 180,
                        protein: 15,
                        carbs: 20,
                        fats: 5,
                        time: "16:00",
                        date: new Date().toISOString()
                    },
                    {
                        id: this.generateId(),
                        mealType: "Dinner",
                        name: "Salmon with sweet potato and asparagus",
                        calories: 400,
                        protein: 30,
                        carbs: 35,
                        fats: 18,
                        time: "19:45",
                        date: new Date().toISOString()
                    }
                ],
                progressData: {
                    weight: [
                        { date: "2023-01-01", value: 180 },
                        { date: "2023-02-01", value: 177 },
                        { date: "2023-03-01", value: 174 },
                        { date: "2023-04-01", value: 172 },
                        { date: "2023-05-01", value: 170 },
                        { date: "2023-06-01", value: 168 }
                    ],
                    measurements: {
                        chest: { current: 38, change: 1 },
                        waist: { current: 32, change: -2 },
                        hips: { current: 36, change: -1 },
                        arms: { current: 14, change: 0.5 }
                    },
                    workoutStats: {
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                        data: [8, 12, 15, 14, 16, 18]
                    }
                },
                goals: {
                    calories: 2000,
                    protein: 120,
                    carbs: 150,
                    fats: 50
                }
            };
        }
    }

    saveData() {
        localStorage.setItem('fitTrackState', JSON.stringify(this.state));
    }

    setupEventListeners() {
        // Window events
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Form submissions
        this.domElements.forms.login?.addEventListener('submit', (e) => this.handleLogin(e));
        this.domElements.forms.signup?.addEventListener('submit', (e) => this.handleSignup(e));
        this.domElements.forms.forgot?.addEventListener('submit', (e) => this.handleForgotPassword(e));

        // Modal close events
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.auth-modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // Close modals when clicking outside
        document.querySelectorAll('.auth-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    setupFormValidation() {
        // Password confirmation validation
        const confirmPassword = document.getElementById('confirm-password');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                const password = document.getElementById('signup-password').value;
                if (confirmPassword.value !== password) {
                    confirmPassword.setCustomValidity("Passwords must match");
                    confirmPassword.classList.add('is-invalid');
                } else {
                    confirmPassword.setCustomValidity("");
                    confirmPassword.classList.remove('is-invalid');
                }
            });
        }

        // Email validation
        const emailFields = [
            document.getElementById('login-email'),
            document.getElementById('signup-email'),
            document.getElementById('resetEmail')
        ].filter(Boolean);

        emailFields.forEach(field => {
            field.addEventListener('input', () => {
                if (!this.validateEmail(field.value)) {
                    field.classList.add('is-invalid');
                } else {
                    field.classList.remove('is-invalid');
                }
            });
        });
    }

    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Utility Methods
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // UI Methods
    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = isLoading ? 'flex' : 'none';
    }

    showError(message) {
        this.state.error = message;
        this.hideAllSections();
        this.domElements.sections.error.style.display = 'block';
        document.getElementById('error-message').textContent = message;
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast show align-items-center text-white bg-${type}`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    hideAllSections() {
        Object.values(this.domElements.sections).forEach(section => {
            if (section) section.style.display = 'none';
        });
    }

    updateUI() {
        if (this.state.currentUser) {
            this.renderDashboard();
            this.renderWorkouts();
            this.renderNutrition();
            this.renderProgress();
        } else {
            this.showHero();
        }
    }

    // Navigation Methods
    showHero() {
        this.hideAllSections();
        this.domElements.sections.hero.style.display = 'flex';
    }

    showDashboard() {
        if (!this.state.currentUser) {
            this.showLogin();
            return;
        }
        this.hideAllSections();
        this.domElements.sections.dashboard.style.display = 'block';
        this.renderDashboard();
    }

    showWorkout() {
        if (!this.state.currentUser) {
            this.showLogin();
            return;
        }
        this.hideAllSections();
        this.domElements.sections.workout.style.display = 'block';
        this.renderWorkouts();
    }

    showNutrition() {
        if (!this.state.currentUser) {
            this.showLogin();
            return;
        }
        this.hideAllSections();
        this.domElements.sections.nutrition.style.display = 'block';
        this.renderNutrition();
        this.initNutritionChart();
    }

    showProgress() {
        if (!this.state.currentUser) {
            this.showLogin();
            return;
        }
        this.hideAllSections();
        this.domElements.sections.progress.style.display = 'block';
        this.renderProgress();
        this.initWeightChart();
        this.initWorkoutChart();
    }

    // Auth Modal Methods
    showLogin() {
        this.domElements.modals.login.style.display = 'flex';
    }

    hideLogin() {
        this.domElements.modals.login.style.display = 'none';
    }

    showSignup() {
        this.hideLogin();
        this.domElements.modals.signup.style.display = 'flex';
    }

    hideSignup() {
        this.domElements.modals.signup.style.display = 'none';
    }

    showForgot() {
        this.hideLogin();
        this.domElements.modals.forgot.style.display = 'flex';
    }

    hideForgot() {
        this.domElements.modals.forgot.style.display = 'none';
    }

    showLoginFromForgot() {
        this.hideForgot();
        this.showLogin();
    }

    // Render Methods
    renderDashboard() {
        // Dashboard is mostly static, no dynamic rendering needed
    }

    renderWorkouts() {
        const container = this.domElements.containers.workoutCards;
        const activityContainer = this.domElements.containers.workoutActivity;

        if (!container || !activityContainer) return;

        // Clear existing content
        container.innerHTML = '';
        activityContainer.innerHTML = '';

        // Render workout cards
        this.state.workouts.forEach(workout => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            card.innerHTML = `
                <div class="card workout-card h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${workout.name}</h5>
                        <p class="card-text">${workout.duration} min • ${workout.difficulty} • ${workout.type}</p>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <span class="badge ${this.getStatusBadgeClass(workout.status)}">${workout.status}</span>
                            <button class="btn btn-sm btn-outline-primary" onclick="app.startWorkout('${workout.id}')">
                                ${workout.status === 'Completed' ? 'Repeat' : workout.status === 'Paused' ? 'Resume' : 'Start'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Render recent activity
        const recentWorkouts = [...this.state.workouts]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        recentWorkouts.forEach(workout => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(workout.createdAt)}</td>
                <td>${workout.name}</td>
                <td>${workout.duration} min</td>
                <td>${workout.calories || 'N/A'} kcal</td>
                <td><span class="badge ${this.getStatusBadgeClass(workout.status)}">${workout.status}</span></td>
            `;
            activityContainer.appendChild(row);
        });
    }

    renderNutrition() {
        const summaryContainer = this.domElements.containers.nutritionSummary;
        const mealsContainer = this.domElements.containers.todayMeals;

        if (!summaryContainer || !mealsContainer) return;

        // Clear existing content
        summaryContainer.innerHTML = '';
        mealsContainer.innerHTML = '';

        // Calculate totals
        const today = new Date().toISOString().split('T')[0];
        const todaysMeals = this.state.nutritionEntries.filter(meal =>
            meal.date && meal.date.includes(today)
        );

        const totals = {
            calories: todaysMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
            protein: todaysMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
            carbs: todaysMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
            fats: todaysMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0)
        };

        // Render summary cards
        const nutrients = [
            { name: 'Calories', value: totals.calories, goal: this.state.goals.calories, unit: '' },
            { name: 'Protein', value: totals.protein, goal: this.state.goals.protein, unit: 'g' },
            { name: 'Carbs', value: totals.carbs, goal: this.state.goals.carbs, unit: 'g' },
            { name: 'Fats', value: totals.fats, goal: this.state.goals.fats, unit: 'g' }
        ];

        nutrients.forEach(nutrient => {
            const progress = (nutrient.value / nutrient.goal) * 100;
            const progressClass = progress > 100 ? 'text-danger' : progress > 90 ? 'text-warning' : 'text-success';

            const card = document.createElement('div');
            card.className = 'col-md-3 mb-3';
            card.innerHTML = `
                <div class="card nutrition-card h-100">
                    <div class="card-body text-center">
                        <h6 class="card-subtitle mb-2 text-muted">${nutrient.name}</h6>
                        <h3 class="card-title">${nutrient.value}${nutrient.unit}</h3>
                        <p class="card-text ${progressClass}">of ${nutrient.goal}${nutrient.unit} goal</p>
                    </div>
                </div>
            `;
            summaryContainer.appendChild(card);
        });

        // Render today's meals
        todaysMeals
            .sort((a, b) => a.time.localeCompare(b.time))
            .forEach((meal, index) => {
                const mealItem = document.createElement('div');
                mealItem.className = 'meal-item';
                mealItem.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6>${meal.mealType}</h6>
                            <p class="text-muted mb-0">${meal.name}</p>
                        </div>
                        <div class="text-end">
                            <span class="d-block">${meal.calories} kcal</span>
                            <small class="text-muted">${meal.time}</small>
                        </div>
                    </div>
                    ${index < todaysMeals.length - 1 ? '<hr>' : ''}
                `;
                mealsContainer.appendChild(mealItem);
            });
    }

    renderProgress() {
        const measurementsContainer = this.domElements.containers.measurements;
        const achievementsContainer = this.domElements.containers.achievements;

        if (!measurementsContainer || !achievementsContainer) return;

        // Clear existing content
        measurementsContainer.innerHTML = '';
        achievementsContainer.innerHTML = '';

        // Render measurements
        Object.entries(this.state.progressData.measurements).forEach(([key, value]) => {
            const row = document.createElement('tr');
            const changeClass = value.change > 0 ? 'text-success' : 'text-danger';
            const changeSymbol = value.change > 0 ? '+' : '';

            row.innerHTML = `
                <td>${this.capitalizeFirstLetter(key)}</td>
                <td>${value.current} in</td>
                <td class="${changeClass}">${changeSymbol}${value.change} in</td>
            `;
            measurementsContainer.appendChild(row);
        });

        // Render achievements (static for demo)
        const achievements = [
            {
                title: "Consistency King",
                description: "Worked out 5 days in a row",
                icon: "bi-trophy",
                color: "primary"
            },
            {
                title: "Weight Loss",
                description: "Lost 5 pounds this month",
                icon: "bi-star",
                color: "success"
            },
            {
                title: "Strength Gain",
                description: "Increased bench press by 20%",
                icon: "bi-lightning",
                color: "warning"
            }
        ];

        achievements.forEach(achievement => {
            const item = document.createElement('div');
            item.className = 'achievement-item d-flex align-items-center mb-3';
            item.innerHTML = `
                <div class="achievement-icon bg-${achievement.color} me-3">
                    <i class="bi ${achievement.icon}"></i>
                </div>
                <div>
                    <h6 class="mb-1">${achievement.title}</h6>
                    <p class="text-muted mb-0">${achievement.description}</p>
                </div>
            `;
            achievementsContainer.appendChild(item);
        });
    }

    // Helper Methods
    getStatusBadgeClass(status) {
        switch (status) {
            case 'Active': return 'bg-primary';
            case 'Completed': return 'bg-success';
            case 'Paused': return 'bg-secondary';
            default: return 'bg-info';
        }
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Form Handlers
    async handleLogin(e) {
        e.preventDefault();
        this.setLoading(true);

        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!this.validateEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.state.currentUser = {
                email,
                name: "Demo User"
            };

            this.state.authToken = 'demo-token-' + Math.random().toString(36).substr(2, 10);

            this.saveData();
            this.hideLogin();
            this.showDashboard();
            this.showToast('Login successful!', 'success');

        } catch (error) {
            this.showToast(error.message, 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        this.setLoading(true);

        try {
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (!firstName || !lastName) {
                throw new Error('Please enter your name');
            }

            if (!this.validateEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.state.currentUser = {
                email,
                name: `${firstName} ${lastName}`
            };

            this.state.authToken = 'demo-token-' + Math.random().toString(36).substr(2, 10);

            this.saveData();
            this.hideSignup();
            this.showDashboard();
            this.showToast(`Welcome to FitTrack, ${this.state.currentUser.name}!`, 'success');

        } catch (error) {
            this.showToast(error.message, 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        this.setLoading(true);

        try {
            const email = document.getElementById('resetEmail').value;

            if (!this.validateEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.hideForgot();
            this.showToast(`Password reset link sent to ${email}`, 'success');

        } catch (error) {
            this.showToast(error.message, 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    // Workout Methods
    showAddWorkoutModal() {
        this.domElements.modals.addWorkout.show();
    }

    addWorkout() {
        try {
            const name = document.getElementById('workout-name').value;
            const type = document.getElementById('workout-type').value;
            const duration = parseInt(document.getElementById('workout-duration').value);
            const difficulty = document.getElementById('workout-difficulty').value;
            const notes = document.getElementById('workout-notes').value;

            if (!name || !type || !duration || !difficulty) {
                throw new Error('Please fill all required fields');
            }

            const newWorkout = {
                id: this.generateId(),
                name,
                type,
                duration,
                difficulty,
                status: 'Active',
                createdAt: new Date().toISOString(),
                calories: Math.floor(duration * 5) // Simple calculation for demo
            };

            this.state.workouts.push(newWorkout);
            this.saveData();

            this.domElements.modals.addWorkout.hide();
            this.showWorkout();
            this.showToast('Workout added successfully!', 'success');

        } catch (error) {
            this.showToast(error.message, 'danger');
        }
    }

    startWorkout(workoutId) {
        const workout = this.state.workouts.find(w => w.id === workoutId);
        if (workout) {
            this.showToast(`Starting ${workout.name} workout`, 'info');
            // In a real app, this would start a workout timer
        }
    }

    // Nutrition Methods
    showAddMealModal() {
        this.domElements.modals.addMeal.show();
    }

    addMeal() {
        try {
            const mealType = document.getElementById('meal-type').value;
            const name = document.getElementById('meal-name').value;
            const calories = parseInt(document.getElementById('meal-calories').value);
            const protein = parseInt(document.getElementById('meal-protein').value) || 0;
            const carbs = parseInt(document.getElementById('meal-carbs').value) || 0;
            const fats = parseInt(document.getElementById('meal-fats').value) || 0;
            const time = document.getElementById('meal-time').value;
            const notes = document.getElementById('meal-notes').value;

            if (!mealType || !name || !calories || !time) {
                throw new Error('Please fill all required fields');
            }

            const newMeal = {
                id: this.generateId(),
                mealType,
                name,
                calories,
                protein,
                carbs,
                fats,
                time,
                date: new Date().toISOString(),
                notes
            };

            this.state.nutritionEntries.push(newMeal);
            this.saveData();

            this.domElements.modals.addMeal.hide();
            this.showNutrition();
            this.showToast('Meal added successfully!', 'success');

        } catch (error) {
            this.showToast(error.message, 'danger');
        }
    }

    // Chart Methods
    initNutritionChart() {
        const ctx = document.getElementById('nutritionChart').getContext('2d');

        if (this.nutritionChart) {
            this.nutritionChart.destroy();
        }

        // Calculate weekly nutrition data (simplified for demo)
        const weeklyData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            calories: [1800, 1950, 2100, 1750, 1900, 2200, 1600],
            protein: [85, 90, 95, 80, 92, 100, 75],
            carbs: [120, 130, 140, 110, 125, 150, 100],
            fats: [45, 50, 55, 40, 48, 60, 35]
        };

        this.nutritionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyData.labels,
                datasets: [
                    {
                        label: 'Calories',
                        data: weeklyData.calories,
                        backgroundColor: 'rgba(142, 45, 226, 0.7)',
                        borderColor: 'rgba(142, 45, 226, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Protein (g)',
                        data: weeklyData.protein,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Carbs (g)',
                        data: weeklyData.carbs,
                        backgroundColor: 'rgba(255, 206, 86, 0.7)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Fats (g)',
                        data: weeklyData.fats,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    initWeightChart() {
        const ctx = document.getElementById('weightChart').getContext('2d');

        if (this.weightChart) {
            this.weightChart.destroy();
        }

        const weightData = this.state.progressData.weight;
        const labels = weightData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('default', { month: 'short' });
        });
        const data = weightData.map(item => item.value);

        this.weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weight (lbs)',
                    data: data,
                    fill: false,
                    borderColor: 'rgba(142, 45, 226, 1)',
                    backgroundColor: 'rgba(142, 45, 226, 0.1)',
                    tension: 0.1,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    initWorkoutChart() {
        const ctx = document.getElementById('workoutChart').getContext('2d');

        if (this.workoutChart) {
            this.workoutChart.destroy();
        }

        const workoutData = this.state.progressData.workoutStats;

        this.workoutChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: workoutData.labels,
                datasets: [{
                    label: 'Workouts Completed',
                    data: workoutData.data,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Check Auth State
    checkAuthState() {
        if (this.state.currentUser) {
            this.showDashboard();
        } else {
            this.showHero();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FitTrackApp();
});

// Global functions for onclick attributes
function showDashboard() { app.showDashboard(); }
function showWorkout() { app.showWorkout(); }
function showNutrition() { app.showNutrition(); }
function showProgress() { app.showProgress(); }
function showLogin() { app.showLogin(); }
function hideLogin() { app.hideLogin(); }
function showSignup() { app.showSignup(); }
function hideSignup() { app.hideSignup(); }
function showForgot() { app.showForgot(); }
function hideForgot() { app.hideForgot(); }
function showLoginFromForgot() { app.showLoginFromForgot(); }
function showAddWorkoutModal() { app.showAddWorkoutModal(); }
function addWorkout() { app.addWorkout(); }
function showAddMealModal() { app.showAddMealModal(); }
function addMeal() { app.addMeal(); }


function isUserLoggedIn() {
    return localStorage.getItem("fittrackUserLoggedIn") === "true";
}

function setUserLoggedIn(status) {
    localStorage.setItem("fittrackUserLoggedIn", status ? "true" : "false");
    updateNavbar();
    updateVisibility();
}

function logout() {
    setUserLoggedIn(false);
    hideAllSections();
    showHero();
}

function updateNavbar() {
    const navList = document.querySelector(".navbar-nav");
    const tryBtn = document.querySelector(".btn-outline-primary");

    if (isUserLoggedIn()) {
        if (tryBtn) tryBtn.style.display = "none";

        if (!document.getElementById("logout-btn")) {
            const logoutItem = document.createElement("li");
            logoutItem.classList.add("nav-item");
            logoutItem.innerHTML = `<a id="logout-btn" class="btn btn-outline-danger ms-3" href="#">LOGOUT</a>`;
            navList.appendChild(logoutItem);

            document.getElementById("logout-btn").addEventListener("click", logout);
        }
    } else {
        if (tryBtn) tryBtn.style.display = "inline-block";

        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) logoutBtn.parentElement.remove();
    }
}


function updateVisibility() {
    if (isUserLoggedIn()) {
        showDashboard();
    } else {
        showHero();
    }
}

function hideAllSections() {
    document.querySelectorAll("section").forEach(s => s.style.display = "none");
}

function showHero() {
    hideAllSections();
    document.getElementById("hero-section").style.display = "flex";
}

function showDashboard() {
    if (!isUserLoggedIn()) return;
    hideAllSections();
    document.getElementById("dashboard-section").style.display = "block";
}

function showWorkout() {
    if (!isUserLoggedIn()) return;
    hideAllSections();
    document.getElementById("workout-section").style.display = "block";
}

function showNutrition() {
    if (!isUserLoggedIn()) return;
    hideAllSections();
    document.getElementById("nutrition-section").style.display = "block";
}

function showProgress() {
    if (!isUserLoggedIn()) return;
    hideAllSections();
    document.getElementById("progress-section").style.display = "block";
}

document.getElementById("login-form").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (email && password.length >= 6) {
        setUserLoggedIn(true);
        hideLogin();
    } else {
        alert("Invalid login");
    }
});

function showLogin() {
    document.getElementById("login-screen").style.display = "flex";
}
function hideLogin() {
    document.getElementById("login-screen").style.display = "none";
}
function showSignup() {
    document.getElementById("signup-screen").style.display = "flex";
    hideLogin();
}
function hideSignup() {
    document.getElementById("signup-screen").style.display = "none";
}
function showForgot() {
    document.getElementById("forgot-screen").style.display = "flex";
    hideLogin();
}
function hideForgot() {
    document.getElementById("forgot-screen").style.display = "none";
}
function showLoginFromForgot() {
    hideForgot();
    showLogin();
}


document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();
    updateVisibility();
});

function showCommunity() {
    if (!isUserLoggedIn()) return;
    hideAllSections();
    document.getElementById("community-section").style.display = "block";
}
