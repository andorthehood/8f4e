#include <stdio.h>
#include <emscripten/emscripten.h>

int main() {
  printf("hello, world!\n");
  return 0;
}

#ifdef __cplusplus
extern "C" {
#endif

EMSCRIPTEN_KEEPALIVE void myFunction(int argc, char ** argv) {
    printf("MyFunction Called\n");
}

#ifdef __cplusplus
}
#endif