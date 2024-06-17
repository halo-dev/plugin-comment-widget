package run.halo.comment.widget.captcha;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.Random;
import lombok.experimental.UtilityClass;
import org.springframework.util.Assert;

@UtilityClass
public class CaptchaGenerator {
    private static final String CHAR_STRING = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int WIDTH = 160;
    private static final int HEIGHT = 40;
    private static final int CHAR_LENGTH = 6;

    private static final Font customFont;

    static {
        customFont = loadArialFont();
    }

    public static BufferedImage generateCaptchaImage(String captchaText) {
        Assert.hasText(captchaText, "Captcha text must not be blank");
        BufferedImage bufferedImage = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = bufferedImage.createGraphics();

        // paint white background
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, WIDTH, HEIGHT);

        g2d.setFont(customFont);

        // draw captcha text
        Random random = new Random();
        for (int i = 0; i < captchaText.length(); i++) {
            g2d.setColor(new Color(random.nextInt(256), random.nextInt(256), random.nextInt(256)));
            g2d.drawString(String.valueOf(captchaText.charAt(i)), 20 + i * 24, 30);
        }

        // add some noise
        for (int i = 0; i < 10; i++) {
            g2d.setColor(new Color(random.nextInt(256), random.nextInt(256), random.nextInt(256)));
            int x1 = random.nextInt(WIDTH);
            int y1 = random.nextInt(HEIGHT);
            int x2 = random.nextInt(WIDTH);
            int y2 = random.nextInt(HEIGHT);
            g2d.drawLine(x1, y1, x2, y2);
        }

        g2d.dispose();
        return bufferedImage;
    }

    private static Font loadArialFont() {
        var fontPath = "/fonts/Arial_Bold.ttf";
        try (InputStream is = CaptchaGenerator.class.getResourceAsStream(fontPath)) {
            if (is == null) {
                throw new RuntimeException("Cannot load font file for " + fontPath + ", please check if it exists.");
            }
            return Font.createFont(Font.TRUETYPE_FONT, is).deriveFont(Font.BOLD, 24);
        } catch (FontFormatException | IOException e) {
            return new Font("Serif", Font.BOLD, 24);
        }
    }

    public static String generateRandomText() {
        StringBuilder sb = new StringBuilder(CHAR_LENGTH);
        Random random = new Random();
        for (int i = 0; i < CHAR_LENGTH; i++) {
            sb.append(CHAR_STRING.charAt(random.nextInt(CHAR_STRING.length())));
        }
        return sb.toString();
    }

    public static String encodeToBase64(BufferedImage image) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", outputStream);
            byte[] imageBytes = outputStream.toByteArray();
            return Base64.getEncoder().encodeToString(imageBytes);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
