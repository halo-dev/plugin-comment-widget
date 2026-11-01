package run.halo.comment.widget.location;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class IpLocationResolverTest {

    @ParameterizedTest
    @CsvSource(delimiter = ';', value = {
        "中国|浙江省|CN;浙江省",
        "中国|0|CN;中国",
        "中国|香港特别行政区|CN;香港特别行政区",
        "United States|California|US;United States",
        "Reserved|Reserved|0;''",
        "0|0|US;''",
        "unexpected format;''"
    })
    void limitsTheDisplayToProvinceOrCountry(String region, String expected) {
        assertThat(IpLocationResolver.displayLocation(region)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
        " ", "unknown", "example.com", "1.2.3.999", "1.2.3", "0.0.0.0", "127.0.0.1",
        "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.1.1", "224.0.0.1",
        "::", "::1", "fe80::1", "fd00::1", "fc00::1", "ff02::1", "::ffff:192.168.1.1"
    })
    void ignoresInvalidAndNonPublicAddresses(String ip) throws Exception {
        var resolver = new IpLocationResolver();
        try {
            assertThat(resolver.resolve(ip)).isEmpty();
        } finally {
            resolver.close();
        }
    }

    @Test
    void queriesBothBundledDatabasesAndClosesResources() throws Exception {
        var resolver = new IpLocationResolver();
        try {
            assertThat(resolver.resolve("1.0.1.1")).isEqualTo("福建省");
            assertThat(resolver.resolve(" 1.0.0.1 ")).isEqualTo("Australia");
            assertThat(resolver.resolve("::ffff:1.0.1.1")).isEqualTo("福建省");
            assertThat(resolver.resolve("240e:3b7:3272:d8d0:db09:c067:8d59:539e"))
                .isNotBlank().doesNotContain("|", ":");
        } finally {
            resolver.close();
        }
        assertThat(resolver.resolve("1.0.1.1")).isEmpty();
    }
}
