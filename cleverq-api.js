const axios = require('axios');

const API_BASE = 'https://cqm.cleverq.de';
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Authorization': 'Token token=vielleichtEinTokenHier?',
};

class CleverQClient {
  constructor(siteSlug = 'norderstedt', fallbackSessionKey = null) {
    this.siteSlug = siteSlug;
    this.siteId = null;
    this.siteName = null;
    this.services = [];
    this.sessionKey = fallbackSessionKey;
    this.cookies = '';
  }

  /**
   * Initializes site info and extracts site ID.
   */
  async initSiteInfo() {
    const url = `${API_BASE}/api/external/v4/sites/info?site_url_name=${encodeURIComponent(this.siteSlug)}&locale=de`;
    const res = await axios.get(url, { headers: DEFAULT_HEADERS });
    this.siteId = res.data.id;
    this.siteName = res.data.name;
    this.services = res.data.services || [];
    return {
      siteId: this.siteId,
      siteName: this.siteName,
      services: this.services,
    };
  }

  /**
   * Fetches a fresh booking_session_key and session cookies from CleverQ index page.
   */
  async refreshSession() {
    const indexUrl = `${API_BASE}/public/appointments/${this.siteSlug}/index.html?lang=de`;
    const res = await axios.get(indexUrl, {
      headers: {
        'User-Agent': DEFAULT_HEADERS['User-Agent'],
      },
    });

    const match = res.data.match(/booking_session_key(?:&quot;|"):(?:&quot;|")([^"&]+)(?:&quot;|")/);
    if (!match || !match[1]) {
      throw new Error('Konnte keinen booking_session_key aus der CleverQ-Seite extrahieren.');
    }

    this.sessionKey = match[1];
    const rawCookies = res.headers['set-cookie'] || [];
    this.cookies = rawCookies.map(c => c.split(';')[0]).join('; ');
    return this.sessionKey;
  }

  /**
   * Returns a valid session key, refreshing if necessary.
   */
  async getSessionKey() {
    if (!this.sessionKey) {
      await this.refreshSession();
    }
    return this.sessionKey;
  }

  /**
   * Fetches available appointment days. Automatically retries once with a fresh session key if expired.
   */
  async getAvailableDays(serviceId, subtaskId, fromDay, toDay, subtaskCount = 1) {
    if (!this.siteId) {
      await this.initSiteInfo();
    }
    await this.getSessionKey();

    const makeRequest = async (key) => {
      const url = `${API_BASE}/api/external/v4/sites/${this.siteId}/appointments/available_days`;
      const params = {
        service_id: serviceId,
        from_day: fromDay,
        to_day: toDay,
        mode_active: false,
        'subtask_items[]': JSON.stringify({ subtask_id: Number(subtaskId), number: Number(subtaskCount) }),
        booking_session_key: key,
      };

      return axios.get(url, {
        params,
        headers: {
          ...DEFAULT_HEADERS,
          'Referer': `${API_BASE}/public/appointments/${this.siteSlug}/index.html?lang=de`,
          'Cookie': this.cookies,
        },
      });
    };

    try {
      const res = await makeRequest(this.sessionKey);
      return res.data.available_days || [];
    } catch (err) {
      // If session expired or unauthorized (403 or code 1012), refresh session and retry once
      const isAuthError = err.response && (err.response.status === 403 || err.response.data?.error === 1012);
      if (isAuthError) {
        console.log('[CleverQ] Session-Key abgelaufen oder ungültig. Erneuere Session...');
        await this.refreshSession();
        const res = await makeRequest(this.sessionKey);
        return res.data.available_days || [];
      }
      throw err;
    }
  }

  /**
   * Fetches available time slots for a specific day.
   */
  async getAvailableTimeSlots(serviceId, subtaskId, day, subtaskCount = 1) {
    if (!this.siteId) {
      await this.initSiteInfo();
    }
    await this.getSessionKey();

    const url = `${API_BASE}/api/external/v4/sites/${this.siteId}/appointments/available_time_slots`;
    const params = {
      service_id: serviceId,
      day: day,
      show_all: true,
      'subtask_items[]': JSON.stringify({ subtask_id: Number(subtaskId), number: Number(subtaskCount) }),
      booking_session_key: this.sessionKey,
    };

    const res = await axios.get(url, {
      params,
      headers: {
        ...DEFAULT_HEADERS,
        'Referer': `${API_BASE}/public/appointments/${this.siteSlug}/index.html?lang=de`,
        'Cookie': this.cookies,
      },
    });

    // res.data has shape: { day, duration_minutes, available_time_slots: [...] }
    const allSlots = Array.isArray(res.data) ? res.data : (res.data?.available_time_slots || []);
    const openSlots = allSlots.filter(s => s.available > 0 && !s.outdated);
    return {
      all: allSlots,
      open: openSlots,
    };
  }

  /**
   * Helper to list all available subtasks.
   */
  async listAllSubtasks() {
    if (!this.siteId) {
      await this.initSiteInfo();
    }
    const result = [];
    for (const s of this.services) {
      for (const st of (s.subtasks || [])) {
        result.push({
          serviceId: s.id,
          serviceName: s.name,
          subtaskId: st.id,
          subtaskName: st.name,
          duration: `${(st.initial_duration || 1) * 5} Min`,
        });
      }
    }
    return result;
  }
}

module.exports = CleverQClient;
