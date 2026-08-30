package com.example.Backend.Service;

import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {
    private final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public String generateOtp(String email) {
        int otpValue = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpValue);
        otpStore.put(email.toLowerCase(), otp);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        if (email == null || otp == null) return false;
        String storedOtp = otpStore.get(email.toLowerCase().trim());
        if (storedOtp != null && storedOtp.equals(otp.trim())) {
            otpStore.remove(email.toLowerCase().trim());
            return true;
        }
        return false;
    }

    public void invalidateOtp(String email) {
        if (email != null) {
            otpStore.remove(email.toLowerCase().trim());
        }
    }
}
