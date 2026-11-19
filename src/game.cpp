#include <algorithm>

namespace {
int lane = 1;
int score = 0;
float elapsed = 0.0f;
bool crashed = false;
}

extern "C" {
void reset_game() {
    lane = 1;
    score = 0;
    elapsed = 0.0f;
    crashed = false;
}

void move_car(int direction) {
    if (crashed) return;
    lane = std::clamp(lane + direction, 0, 2);
}

void update_game(float delta_seconds, int obstacle_lane, float obstacle_y) {
    if (crashed) return;
    elapsed += delta_seconds;
    score = static_cast<int>(elapsed * 10.0f);
    const bool same_lane = lane == obstacle_lane;
    const bool overlap = obstacle_y + 72.0f > 530.0f && obstacle_y < 598.0f;
    if (same_lane && overlap) crashed = true;
}

int get_score() { return score; }
int get_lane() { return lane; }
int is_crashed() { return crashed ? 1 : 0; }
}
