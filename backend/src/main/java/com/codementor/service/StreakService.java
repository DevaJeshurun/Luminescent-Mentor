package com.codementor.service;

import com.codementor.model.User;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class StreakService {

    /**
     * Updates streak when the user is active on a calendar day (login, dashboard, solve, etc.).
     * Idempotent for multiple calls on the same day.
     */
    public void recordDailyActivity(User user) {
        String today = LocalDate.now().toString();
        String last = user.getLastActiveDate();
        if (today.equals(last)) {
            if (user.getStreakDays() == null || user.getStreakDays() == 0) {
                user.setStreakDays(1);
            }
            return;
        }
        if (last == null || last.isBlank()) {
            user.setStreakDays(1);
            user.setLastActiveDate(today);
            return;
        }
        LocalDate lastDate = LocalDate.parse(last);
        int current = user.getStreakDays() == null ? 0 : user.getStreakDays();
        if (lastDate.plusDays(1).equals(LocalDate.now())) {
            user.setStreakDays(current + 1);
        } else {
            user.setStreakDays(1);
        }
        user.setLastActiveDate(today);
    }
}
