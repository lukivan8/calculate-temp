def calculate_temperature_seams():
    # Ввод данных
    print("Калькулятор температурных швов (СП РК EN 1991-1-5)")
    
    city = input("Город: ")
    building_type = input("Тип здания (rc - железобетон, steel - металл, brick - кирпич): ").lower()
    heating = input("Режим эксплуатации (heated - отапливаемое, unheated - неотапливаемое): ").lower()
    length = float(input("Длина здания, м: "))
    t0 = float(input("Начальная температура T0, °C: "))
    tmax = float(input("Максимальная температура Tmax, °C: "))
    tmin = float(input("Минимальная температура Tmin, °C: "))

    # Коэффициенты температурного расширения (1/°C)
    alpha = {
        'rc': 10e-6,    # железобетон
        'steel': 12e-6, # металл
        'brick': 5e-6   # кирпич
    }.get(building_type, 0)

    # Допустимая деформация (безразмерная величина)
    epsilon = {
        'rc': 0.0001,   # 0.01% для железобетона
        'steel': 0.002, # 0.2% для металла
        'brick': 0.00005 # 0.005% для кирпича
    }.get(building_type, 0)

    # Расчёт перепадов температур
    delta_t1 = tmax - t0
    delta_t2 = t0 - tmin
    delta_t = max(delta_t1, delta_t2)  # ΔT_расч

    # Компоненты температурного воздействия
    delta_tu = delta_t
    delta_tm = {
        'rc': 10,
        'steel': 15,
        'brick': 5
    }.get(building_type, 0)
    delta_tr = 3 if length <= 10 else 5  # Упрощённо
    delta_tsum = delta_tu + delta_tm + delta_tr

    # Теоретическая максимальная длина блока
    l_max = epsilon / (alpha * delta_tsum)

    # Принимаемая длина блока (по рекомендациям)
    l_fact = 0
    if building_type == 'rc':
        l_fact = 50 if heating == 'heated' else 40
    elif building_type == 'steel':
        l_fact = 60 if heating == 'heated' else 50
    else:
        l_fact = 45 if heating == 'heated' else 35

    # Количество швов и шаг между ними
    n_shifts = int(length / l_fact) + 1
    s_step = length / (n_shifts - 1) if n_shifts > 1 else length

    # Вывод результатов
    print("\n=== Результаты расчёта ===")
    print(f"Расчётный перепад ΔT_расч: {delta_t:.2f} °C")
    print(f"Суммарный температурный эффект ΔT_сум: {delta_tsum:.2f} °C")
    print(f"Максимальная длина блока L_max (теоретическая): {l_max:.2f} м")
    print(f"Принимаемая длина блока L_факт: {l_fact} м")
    print(f"Количество швов N: {n_shifts} шт.")
    print(f"Шаг между швами S: {s_step:.2f} м")

# Запуск программы
if __name__ == "__main__":
    calculate_temperature_seams()
