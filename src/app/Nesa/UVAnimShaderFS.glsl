varying vec2 vMYUv;
uniform sampler2D map2;

uniform vec3 diffuse;
uniform float alpha;

void main() {
	gl_FragColor = vec4( 1.0, 1.0, 0.0, 1.0 ) ;
    gl_FragColor = texture2D( map2, vMYUv );
    if(vMYUv.x > 1.0)
    {
        discard;
    }
    gl_FragColor.a = gl_FragColor.a * alpha;
    
}